import type {
  SelfAdjustmentRow,
  SelfEvaluationRow,
  TutorScoreRow,
} from './evaluation-history.types';

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

export function mapPeerAdjustments(
  rows: Array<{ studentId: string; previousValue: string | number; newValue: string | number }>,
): Map<string, { previousValue: number; newValue: number }> {
  const map = new Map<string, { previousValue: number; newValue: number }>();
  for (const row of rows) {
    if (!map.has(row.studentId)) {
      map.set(row.studentId, {
        previousValue: Number(row.previousValue),
        newValue: Number(row.newValue),
      });
    }
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

export function mapTutors(rows: TutorScoreRow[]) {
  const tutorMap = new Map<string, Array<{ criterionId: string; score: number }>>();
  const tutorBonusMap = new Map<string, number | null>();
  for (const row of rows) {
    const list = tutorMap.get(row.studentId) ?? [];
    list.push({ criterionId: row.criterionId, score: Number(row.score) });
    tutorMap.set(row.studentId, list);
    if (!tutorBonusMap.has(row.studentId)) {
      const bonus =
        row.bonusScore !== null && row.bonusScore !== undefined ? Number(row.bonusScore) : null;
      tutorBonusMap.set(row.studentId, bonus);
    }
  }
  return { tutorMap, tutorBonusMap };
}
