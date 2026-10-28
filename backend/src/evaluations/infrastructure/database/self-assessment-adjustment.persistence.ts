import type { EntityManager } from 'typeorm';
import { requireFirstRow } from '@/shared/database/rows';
import type { PlannedAdjustment } from '../../application/services/self-assessment-adjustment-policy';
import {
  INSERT_EVALUATION_ADJUSTMENT,
  INSERT_PEER_FORM_ADJUSTMENT,
  INSERT_POKER_ADJUSTMENT,
} from './self-assessment-adjustment.queries';
import type { AdjustmentRow } from './self-assessment-adjustment.reads';

export {
  resolveAndReadHistory,
  toAdjustment,
  type AdjustmentRow,
} from './self-assessment-adjustment.reads';

export async function persistAdjustment(
  manager: EntityManager,
  planned: PlannedAdjustment,
  authorId: string,
): Promise<AdjustmentRow> {
  if (planned.pokerRoundId) {
    return persistPoker(manager, planned, authorId);
  }
  if (planned.sessionId && planned.studentId && planned.tipo === 'PARES') {
    return persistPeerForm(manager, planned, authorId);
  }
  return persistSelf(manager, planned, authorId);
}

async function persistPoker(
  manager: EntityManager,
  planned: PlannedAdjustment,
  authorId: string,
): Promise<AdjustmentRow> {
  const rows = await manager.query<AdjustmentRow[]>(INSERT_POKER_ADJUSTMENT, [
    planned.pokerRoundId,
    planned.previousValue,
    planned.newValue,
    planned.justification,
    authorId,
  ]);
  return requireFirstRow(rows, 'Failed to persist poker grade adjustment.');
}

async function persistPeerForm(
  manager: EntityManager,
  planned: PlannedAdjustment,
  authorId: string,
): Promise<AdjustmentRow> {
  const rows = await manager.query<AdjustmentRow[]>(INSERT_PEER_FORM_ADJUSTMENT, [
    planned.sessionId,
    planned.studentId,
    planned.previousValue,
    planned.newValue,
    planned.justification,
    authorId,
  ]);
  return requireFirstRow(rows, 'Failed to persist peer grade adjustment.');
}

async function persistSelf(
  manager: EntityManager,
  planned: PlannedAdjustment,
  authorId: string,
): Promise<AdjustmentRow> {
  const rows = await manager.query<AdjustmentRow[]>(INSERT_EVALUATION_ADJUSTMENT, [
    planned.evaluationId,
    planned.previousValue,
    planned.newValue,
    planned.justification,
    authorId,
  ]);
  return requireFirstRow(rows, 'Failed to persist grade adjustment.');
}
