import type { EntityManager } from 'typeorm';
import { NotFoundError, UnprocessableEntityError } from '@/shared/errors/application.error';
import type { SessionEvaluationConfig } from '../../domain/entities/session-evaluation-config.entity';
import type { SessionEvaluationCriterion } from '../../domain/entities/session-evaluation-criterion.entity';
import {
  readSessionConfiguration,
  toEvaluationFormula,
} from '@/sessions/infrastructure/database/session-configuration.read.persistence';

interface TableRow {
  tableId: string;
  tableName: string;
}
interface CriterionRow extends Omit<SessionEvaluationCriterion, 'weight'> {
  weight: string;
}

export async function readProblemConfig(
  manager: EntityManager,
  problemId: string,
): Promise<SessionEvaluationConfig> {
  const [session] = await manager.query<Array<{ id: string }>>(
    `SELECT id FROM sessions WHERE problem_id = $1 ORDER BY order_index LIMIT 1;`,
    [problemId],
  );
  if (!session) {
    throw new UnprocessableEntityError('Este problema ainda não possui sessões configuradas.');
  }
  return readSessionConfiguration(manager, session.id);
}

export async function readSessionTableConfig(
  manager: EntityManager,
  sessionId: string,
): Promise<SessionEvaluationConfig> {
  return readSessionConfiguration(manager, sessionId);
}

export async function readSessionConfig(
  manager: EntityManager,
  sessionId: string,
): Promise<SessionEvaluationConfig | null> {
  const [config] = await manager.query<TableRow[]>(
    `SELECT performance_table_id AS "tableId", table_name AS "tableName"
     FROM session_evaluation_configs WHERE session_id = $1;`,
    [sessionId],
  );
  if (!config) return null;
  return {
    ...config,
    criteria: (await readSnapshotCriteria(manager, sessionId)).map(toCriterion),
    frozen: true,
    formula: await readFormula(manager, sessionId),
  };
}

async function readSnapshotCriteria(
  manager: EntityManager,
  sessionId: string,
): Promise<CriterionRow[]> {
  return manager.query<CriterionRow[]>(
    `SELECT criterion_id AS id, name, description, weight, order_index AS "orderIndex"
       FROM session_evaluation_criteria WHERE session_id = $1 ORDER BY order_index;`,
    [sessionId],
  );
}

async function readFormula(
  manager: EntityManager,
  sessionId: string,
): Promise<{ criteriaWeight: number; roleWeight: number }> {
  const rows = await manager.query<Array<{ type: string; weight: string | number }>>(
    `SELECT fc.type, fc.weight FROM formulas f
       JOIN formula_components fc ON fc.formula_id = f.id
      WHERE f.session_id = $1 AND f.scope = 'SESSAO' AND f.active = TRUE;`,
    [sessionId],
  );
  return toEvaluationFormula(rows);
}

export async function freezeSessionConfig(
  manager: EntityManager,
  sessionId: string,
  authorId: string,
): Promise<SessionEvaluationConfig> {
  await manager.query(
    `SELECT pt.id FROM sessions s
      JOIN performance_tables pt ON pt.id = s.performance_table_id
     WHERE s.id = $1 FOR SHARE OF pt;`,
    [sessionId],
  );
  const existing = await readSessionConfig(manager, sessionId);
  if (existing) return existing;
  const config = await readSessionConfiguration(manager, sessionId);
  if (config.criteria.length === 0)
    throw new UnprocessableEntityError('A tabela vinculada não possui critérios ativos.');
  await insertSnapshot(manager, sessionId, authorId, config);
  return { ...config, frozen: true };
}

async function insertSnapshot(
  manager: EntityManager,
  sessionId: string,
  authorId: string,
  config: SessionEvaluationConfig,
): Promise<void> {
  await manager.query(
    `INSERT INTO session_evaluation_configs (session_id, performance_table_id, table_name, created_by) VALUES ($1, $2, $3, $4);`,
    [sessionId, config.tableId, config.tableName, authorId],
  );
  for (const criterion of config.criteria)
    await insertSnapshotCriterion(manager, sessionId, criterion);
}

async function insertSnapshotCriterion(
  manager: EntityManager,
  sessionId: string,
  criterion: SessionEvaluationCriterion,
): Promise<void> {
  await manager.query(
    `INSERT INTO session_evaluation_criteria (session_id, criterion_id, name, description, weight, order_index)
     VALUES ($1, $2, $3, $4, $5, $6);`,
    [
      sessionId,
      criterion.id,
      criterion.name,
      criterion.description,
      criterion.weight,
      criterion.orderIndex,
    ],
  );
}

export async function assertSessionExists(
  manager: EntityManager,
  sessionId: string,
  problemId: string,
): Promise<void> {
  const rows = await manager.query<{ id: string }[]>(
    'SELECT id FROM sessions WHERE id = $1 AND problem_id = $2 FOR UPDATE;',
    [sessionId, problemId],
  );
  if (rows.length === 0) throw new NotFoundError('Sessão não encontrada.');
}

const toCriterion = (row: CriterionRow): SessionEvaluationCriterion => ({
  ...row,
  weight: Number(row.weight),
});
