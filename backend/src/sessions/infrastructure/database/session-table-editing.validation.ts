import type { EntityManager } from 'typeorm';
import { ConflictError, UnprocessableEntityError } from '@/shared/errors/application.error';
import type { SessionTableEditPlan } from '../../domain/repositories/session-table-editing.repository';

export async function assertStoredScoresFit(
  manager: EntityManager,
  plan: SessionTableEditPlan,
): Promise<void> {
  await assertTutorItemsRemainValid(manager, plan);
  const rows = await manager.query<Array<{ criterionId: string; score: string }>>(STORED_SCORES, [
    plan.sessions.map((session) => session.sessionId),
  ]);
  const criteria = new Map(plan.table.criteria.map((criterion) => [criterion.id, criterion]));
  for (const row of rows) {
    const criterion = criteria.get(row.criterionId);
    if (criterion && Number(row.score) > criterion.maxScore) {
      throw new UnprocessableEntityError(
        'A nota máxima não pode ficar abaixo de uma nota já registrada.',
      );
    }
  }
}

async function assertTutorItemsRemainValid(
  manager: EntityManager,
  plan: SessionTableEditPlan,
): Promise<void> {
  const ids = plan.table.criteria.flatMap((criterion) => (criterion.id ? [criterion.id] : []));
  const [row] = await manager.query<Array<{ incompatible: boolean }>>(INCOMPATIBLE_TUTOR_ITEMS, [
    plan.sessions.map((session) => session.sessionId),
    ids,
  ]);
  if (row?.incompatible)
    throw new ConflictError(
      'A configuração da tabela diverge das avaliações enviadas. Preserve os critérios dessas avaliações.',
    );
}

const INCOMPATIBLE_TUTOR_ITEMS = `
  SELECT EXISTS (
    SELECT 1 FROM evaluations e WHERE e.session_id = ANY($1::uuid[])
      AND e.type = 'TUTOR_SESSION' AND e.status = 'SUBMITTED'
      AND (EXISTS (SELECT 1 FROM evaluation_items ei WHERE ei.evaluation_id = e.id
                    AND NOT (ei.criterion_id = ANY($2::uuid[])))
        OR (SELECT count(*) FROM evaluation_items ei WHERE ei.evaluation_id = e.id) <> cardinality($2::uuid[]))
  ) AS incompatible;
`;

const STORED_SCORES = `
  SELECT ei.criterion_id AS "criterionId", ei.score
    FROM evaluation_items ei JOIN evaluations e ON e.id = ei.evaluation_id
   WHERE e.session_id = ANY($1::uuid[])
  UNION ALL
  SELECT criterion_id AS "criterionId", score FROM criterion_grades
   WHERE session_id = ANY($1::uuid[]) AND score IS NOT NULL;
`;
