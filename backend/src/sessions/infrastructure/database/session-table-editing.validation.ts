import type { EntityManager } from 'typeorm';
import { ConflictError } from '@/shared/errors/application.error';
import type { SessionTableEditPlan } from '../../domain/repositories/session-table-editing.repository';

export async function assertTutorItemsRemainValid(
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
