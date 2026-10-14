import type { Auditable } from '@/shared/interfaces/auditable.interface';
import { EvaluationStatus } from '../enums/evaluation-status.enum';
import { InvalidEvaluationStateError } from '../errors/invalid-evaluation.error';
import { EvaluationRules, type CriterionScore } from '../services/evaluation-rules';
import {
  SessionGradeCalculator,
  SESSION_CALCULATION_VERSION,
} from '../services/session-grade-calculator';
import type { EvaluationItem } from './evaluation-item.entity';
import type { ScoreChange } from './grade-adjustment.entity';
import type { SessionEvaluationConfig } from './session-evaluation-config.entity';

export interface EvaluationRevision {
  items: CriterionScore[];
  submit: boolean;
  justification?: string;
  authorId: string;
  bonus: number | null;
  now: Date;
}

export class Evaluation implements Auditable {
  id: string;
  status: EvaluationStatus;
  submittedAt: Date | null;
  sessionScore: number | null;
  appliedBonus: number | null;
  calculationVersion: string | null;
  createdBy: string;
  createdAt: Date;
  updatedBy: string | null;
  updatedAt: Date;
  items: EvaluationItem[];

  revise(input: EvaluationRevision, config: SessionEvaluationConfig): ScoreChange[] {
    const submitted = this.status === EvaluationStatus.SUBMITTED;
    if (submitted && !input.submit)
      throw new InvalidEvaluationStateError('Uma avaliação enviada não pode voltar a rascunho.');
    EvaluationRules.assertValidItems(input.items, config.criteria, input.submit || submitted);
    const changes = submitted ? this.findChanges(input.items) : [];
    if (changes.length > 0) EvaluationRules.assertAdjustmentJustification(input.justification);
    if (input.submit) this.applyGrade(input, config, submitted);
    this.updatedBy = input.authorId;
    this.updatedAt = input.now;
    return changes;
  }

  private findChanges(items: CriterionScore[]): ScoreChange[] {
    const previous = new Map(this.items.map((item) => [item.criterionId, item]));
    return items.flatMap((item) => {
      const old = previous.get(item.criterionId);
      if (!old || old.score === item.score) return [];
      return [{ itemId: old.id, previousValue: old.score, newValue: item.score }];
    });
  }

  private applyGrade(
    input: EvaluationRevision,
    config: SessionEvaluationConfig,
    submitted: boolean,
  ): void {
    const bonus = submitted ? this.appliedBonus! : input.bonus;
    this.sessionScore = SessionGradeCalculator.calculate(
      input.items,
      config.criteria,
      bonus,
      true,
      config.formula,
    );
    this.appliedBonus = bonus;
    this.calculationVersion = SESSION_CALCULATION_VERSION;
    this.submittedAt ??= input.now;
    this.status = EvaluationStatus.SUBMITTED;
  }
}
