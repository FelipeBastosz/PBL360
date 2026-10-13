import type { SelfAdjustmentRow, SelfEvaluationRow } from './evaluation-history.types';

export function mapSelf(rows: SelfEvaluationRow[]): Map<string, SelfEvaluationRow> {
  const map = new Map<string, SelfEvaluationRow>();
  for (const row of rows) map.set(row.studentId, row);
  return map;
}

export function mapAdjustments(rows: SelfAdjustmentRow[]): Map<string, SelfAdjustmentRow> {
  const map = new Map<string, SelfAdjustmentRow>();
  for (const row of rows) {
    if (!map.has(row.evaluationId)) map.set(row.evaluationId, row);
  }
  return map;
}

export function mapPeers(rows: Array<{ studentId: string; sessionScore: string | number }>) {
  const map = new Map<string, number[]>();
  for (const row of rows) {
    const list = map.get(row.studentId) ?? [];
    list.push(Number(row.sessionScore));
    map.set(row.studentId, list);
  }
  return map;
}

export function mapTutors(
  rows: Array<{ studentId: string; criterionId: string; score: string | number }>,
) {
  const map = new Map<string, Array<{ criterionId: string; score: number }>>();
  for (const row of rows) {
    const list = map.get(row.studentId) ?? [];
    list.push({ criterionId: row.criterionId, score: Number(row.score) });
    map.set(row.studentId, list);
  }
  return map;
}
