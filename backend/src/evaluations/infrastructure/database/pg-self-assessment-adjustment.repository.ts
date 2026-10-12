import { Injectable } from '@nestjs/common';
import { DataSource, type EntityManager } from 'typeorm';
import { requireFirstRow } from '@/shared/database/rows';
import { planSelfAssessmentAdjustment } from '../../application/services/self-assessment-adjustment-policy';
import type { EvaluationAdjustment } from '../../domain/entities/grade-adjustment.entity';
import type { EvaluationStatus } from '../../domain/enums/evaluation-status.enum';
import type {
  RecordedSelfAssessmentAdjustment,
  SelfAssessmentAdjustmentHistory,
  SelfAssessmentAdjustmentRepository,
  SelfAssessmentAdjustmentWrite,
} from '../../domain/repositories/self-assessment-adjustment.repository';
import {
  FIND_EVALUATION_ADJUSTMENTS,
  FIND_SELF_ASSESSMENT_SCORE,
  INSERT_EVALUATION_ADJUSTMENT,
  LOCK_SELF_ASSESSMENT_SCORE,
} from './self-assessment-adjustment.queries';

interface ScoreRow {
  id: string;
  status: EvaluationStatus;
  sessionScore: string | null;
}

interface AdjustmentRow extends Omit<EvaluationAdjustment, 'previousValue' | 'newValue'> {
  previousValue: string;
  newValue: string;
}

@Injectable()
export class PgSelfAssessmentAdjustmentRepository implements SelfAssessmentAdjustmentRepository {
  constructor(private readonly dataSource: DataSource) {}

  findHistory(sessionId: string, studentId: string) {
    return this.dataSource.transaction('REPEATABLE READ', (manager) =>
      readHistory(manager, FIND_SELF_ASSESSMENT_SCORE, sessionId, studentId),
    );
  }

  record(input: SelfAssessmentAdjustmentWrite) {
    return this.dataSource.transaction((manager) => recordAdjustment(manager, input));
  }
}

async function recordAdjustment(
  manager: EntityManager,
  input: SelfAssessmentAdjustmentWrite,
): Promise<RecordedSelfAssessmentAdjustment> {
  const { sessionId, studentId } = input;
  const history = await readHistory(manager, LOCK_SELF_ASSESSMENT_SCORE, sessionId, studentId);
  const planned = planSelfAssessmentAdjustment(history, input.newScore, input.justification);
  const rows = await manager.query<AdjustmentRow[]>(INSERT_EVALUATION_ADJUSTMENT, [
    planned.evaluationId,
    planned.previousValue,
    planned.newValue,
    planned.justification,
    input.authorId,
  ]);
  return {
    originalScore: planned.originalScore,
    adjustment: toAdjustment(requireFirstRow(rows, 'Failed to persist grade adjustment.')),
  };
}

async function readHistory(
  manager: EntityManager,
  scoreQuery: string,
  sessionId: string,
  studentId: string,
): Promise<SelfAssessmentAdjustmentHistory | null> {
  const [row] = await manager.query<ScoreRow[]>(scoreQuery, [sessionId, studentId]);
  if (!row) return null;
  const adjustments = await manager.query<AdjustmentRow[]>(FIND_EVALUATION_ADJUSTMENTS, [row.id]);
  return {
    evaluationId: row.id,
    status: row.status,
    originalScore: row.sessionScore === null ? null : Number(row.sessionScore),
    adjustments: adjustments.map(toAdjustment),
  };
}

const toAdjustment = (row: AdjustmentRow): EvaluationAdjustment => ({
  ...row,
  previousValue: Number(row.previousValue),
  newValue: Number(row.newValue),
});
