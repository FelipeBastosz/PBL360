import type { EntityManager } from 'typeorm';
import { lockSessionPerformanceTable } from '@/sessions/infrastructure/database/session-table-lock.persistence';
import { NotFoundError, UnprocessableEntityError } from '@/shared/errors/application.error';
import { validateEvaluationRules } from '../../application/services/evaluation-rule-validation';
import type {
  EvaluationWrite,
  EvaluationDetail,
} from '../../domain/repositories/evaluation.repository';
import type { SessionEvaluationConfig } from '../../domain/entities/session-evaluation-config.entity';
import type { Evaluation } from '../../domain/entities/evaluation.entity';
import { readEvaluation, readEvaluationDetail } from './evaluation.reads';
import { freezeSessionConfig, assertSessionExists } from './session-evaluation-config.persistence';
import { persistAdjustments, persistEvaluationItems } from './evaluation-item.persistence';
import { UPDATE_EVALUATION } from './evaluation.queries';

export async function recordEvaluation(
  manager: EntityManager,
  input: EvaluationWrite,
): Promise<EvaluationDetail> {
  await lockSessionPerformanceTable(manager, input.context.sessionId);
  await lockEvaluationContext(manager, input);
  const { sessionId } = input.context;
  const config = await freezeSessionConfig(manager, sessionId, input.authorId);
  await ensureEvaluation(manager, input, config.tableId);
  const evaluation = (await readEvaluation(manager, sessionId, input.studentId))!;
  await reviseEvaluation(manager, input, evaluation, config);
  return readEvaluationDetail(manager, input.context, input.studentId);
}

async function reviseEvaluation(
  manager: EntityManager,
  input: EvaluationWrite,
  evaluation: Evaluation,
  config: SessionEvaluationConfig,
): Promise<void> {
  const revision = { ...input, bonus: await readBonus(manager, input), now: new Date() };
  const changes = validateEvaluationRules(() => evaluation.revise(revision, config));
  await persistAdjustments(
    manager,
    changes,
    input.authorId,
    input.justification ?? '',
    revision.now,
  );
  await persistEvaluationItems(manager, evaluation.id, input.items);
  await updateEvaluation(manager, evaluation);
}

async function lockEvaluationContext(
  manager: EntityManager,
  input: EvaluationWrite,
): Promise<void> {
  const { problemId, roomId, sessionId } = input.context;
  const rows = await manager.query<{ id: string }[]>(
    'SELECT id FROM problems WHERE id = $1 AND room_id = $2 FOR UPDATE;',
    [problemId, roomId],
  );
  if (rows.length === 0) throw new NotFoundError('Problema não encontrado.');
  await assertSessionExists(manager, sessionId, problemId);
  const students = await manager.query<{ student_id: string }[]>(
    'SELECT student_id FROM room_students WHERE room_id = $1 AND student_id = $2 FOR SHARE;',
    [roomId, input.studentId],
  );
  if (students.length === 0)
    throw new UnprocessableEntityError('O aluno não está matriculado na sala.');
}

async function ensureEvaluation(
  manager: EntityManager,
  input: EvaluationWrite,
  tableId: string,
): Promise<void> {
  await manager.query(
    `INSERT INTO evaluations (evaluator_id, student_id, problem_id, session_id, config_session_id, performance_table_id, type, created_by)
     VALUES ($1, $2, $3, $4, $4, $5, 'TUTOR_SESSION', $1)
     ON CONFLICT (session_id, student_id) WHERE type = 'TUTOR_SESSION' DO NOTHING;`,
    [input.authorId, input.studentId, input.context.problemId, input.context.sessionId, tableId],
  );
}

async function readBonus(manager: EntityManager, input: EvaluationWrite): Promise<number | null> {
  const [row] = await manager.query<{ bonus: string | null }[]>(
    'SELECT role_score AS bonus FROM session_roles WHERE session_id = $1 AND student_id = $2 FOR SHARE;',
    [input.context.sessionId, input.studentId],
  );
  return row?.bonus === null || row?.bonus === undefined ? null : Number(row.bonus);
}

async function updateEvaluation(manager: EntityManager, evaluation: Evaluation): Promise<void> {
  await manager.query(UPDATE_EVALUATION, [
    evaluation.id,
    evaluation.status,
    evaluation.submittedAt,
    evaluation.sessionScore,
    evaluation.appliedBonus,
    evaluation.calculationVersion,
    evaluation.updatedBy,
    evaluation.updatedAt,
  ]);
}
