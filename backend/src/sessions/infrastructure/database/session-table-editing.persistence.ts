import { randomUUID } from 'node:crypto';
import type { EntityManager } from 'typeorm';
import type { PerformanceCriterion } from '@/performance-tables/domain/entities/performance-criterion.entity';
import { syncPerformanceCriteria } from '@/performance-tables/infrastructure/database/performance-criteria.persistence';
import type {
  SessionTableEditPlan,
  SessionTableEditResult,
} from '../../domain/repositories/session-table-editing.repository';
import {
  replaceSessionSnapshot,
  removeObsoleteDraftItems,
} from './session-evaluation-snapshot.persistence';
import { assertStoredScoresFit } from './session-table-editing.validation';

export async function persistSessionTableEdit(
  manager: EntityManager,
  plan: SessionTableEditPlan,
): Promise<SessionTableEditResult> {
  await assertStoredScoresFit(manager, plan);
  const criterionIds = plan.copy ? await insertTableCopy(manager, plan) : new Map<string, string>();
  if (!plan.copy) await updateOriginalTable(manager, plan);
  for (const session of plan.sessions) {
    await updateSessionReferences(manager, session.sessionId, plan, criterionIds);
  }
  return { table: { id: plan.table.id, name: plan.table.name }, sessions: plan.sessions };
}

async function insertTableCopy(
  manager: EntityManager,
  plan: SessionTableEditPlan,
): Promise<Map<string, string>> {
  const table = plan.table;
  table.id = randomUUID();
  await manager.query(
    `INSERT INTO performance_tables (id, tutor_id, room_id, name, description, is_default)
     VALUES ($1, $2, $3, $4, $5, FALSE);`,
    [table.id, table.tutorId, table.roomId, table.name, table.description],
  );
  const ids = new Map<string, string>();
  for (const criterion of table.criteria) {
    const newId = randomUUID();
    if (criterion.id) ids.set(criterion.id, newId);
    await insertCopiedCriterion(manager, table.id, criterion, newId);
  }
  return ids;
}

async function insertCopiedCriterion(
  manager: EntityManager,
  tableId: string,
  criterion: PerformanceCriterion,
  id: string,
): Promise<void> {
  await manager.query(
    `INSERT INTO performance_criteria (id, performance_table_id, name, description, order_index, weight, max_score)
     VALUES ($1, $2, $3, $4, $5, $6, $7);`,
    [
      id,
      tableId,
      criterion.name,
      criterion.description,
      criterion.orderIndex,
      criterion.weight,
      criterion.maxScore,
    ],
  );
}

async function updateOriginalTable(
  manager: EntityManager,
  plan: SessionTableEditPlan,
): Promise<void> {
  await manager.query(
    'UPDATE performance_tables SET name = $2, updated_at = now() WHERE id = $1;',
    [plan.table.id, plan.table.name],
  );
  await syncPerformanceCriteria(manager, plan.table);
}

async function updateSessionReferences(
  manager: EntityManager,
  sessionId: string,
  plan: SessionTableEditPlan,
  ids: Map<string, string>,
): Promise<void> {
  if (plan.copy) await remapScores(manager, sessionId, ids);
  await manager.query('UPDATE sessions SET performance_table_id = $2 WHERE id = $1;', [
    sessionId,
    plan.table.id,
  ]);
  await refreshSnapshot(manager, sessionId, plan);
  await manager.query('UPDATE evaluations SET performance_table_id = $2 WHERE session_id = $1;', [
    sessionId,
    plan.table.id,
  ]);
}

async function refreshSnapshot(
  manager: EntityManager,
  sessionId: string,
  plan: SessionTableEditPlan,
): Promise<void> {
  const [snapshot] = await manager.query<Array<{ session_id: string }>>(
    'SELECT session_id FROM session_evaluation_configs WHERE session_id = $1;',
    [sessionId],
  );
  if (snapshot) {
    await replaceSessionSnapshot(manager, sessionId, {
      id: plan.table.id,
      name: plan.table.name,
      isDefault: false,
    });
    await removeObsoleteDraftItems(manager, sessionId);
  }
}

async function remapScores(
  manager: EntityManager,
  sessionId: string,
  ids: Map<string, string>,
): Promise<void> {
  for (const [oldId, newId] of ids) {
    await manager.query(
      `UPDATE evaluation_items ei SET criterion_id = $3 FROM evaluations e
        WHERE e.id = ei.evaluation_id AND e.session_id = $1 AND ei.criterion_id = $2;`,
      [sessionId, oldId, newId],
    );
    await manager.query(
      'UPDATE criterion_grades SET criterion_id = $3 WHERE session_id = $1 AND criterion_id = $2;',
      [sessionId, oldId, newId],
    );
  }
}
