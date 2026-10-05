import { Evaluation } from '../../domain/entities/evaluation.entity';
import type { EvaluationStatus } from '../../domain/enums/evaluation-status.enum';
import type { EvaluationItem } from '../../domain/entities/evaluation-item.entity';

export interface EvaluationRow {
  id: string;
  status: EvaluationStatus;
  submittedAt: Date | null;
  sessionScore: string | null;
  appliedBonus: string | null;
  calculationVersion: string | null;
  createdBy: string;
  createdAt: Date;
  updatedBy: string | null;
  updatedAt: Date;
}
export interface EvaluationItemRow extends Omit<EvaluationItem, 'score'> {
  score: string;
}
export const toEvaluation = (row: EvaluationRow, items: EvaluationItemRow[]): Evaluation =>
  Object.assign(new Evaluation(), row, {
    sessionScore: row.sessionScore === null ? null : Number(row.sessionScore),
    appliedBonus: row.appliedBonus === null ? null : Number(row.appliedBonus),
    items: items.map((item) => ({ ...item, score: Number(item.score) })),
  });
