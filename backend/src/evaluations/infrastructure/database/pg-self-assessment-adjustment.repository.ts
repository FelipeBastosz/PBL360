import { Injectable } from '@nestjs/common';
import { DataSource, type EntityManager } from 'typeorm';
import { planSelfAssessmentAdjustment } from '../../application/services/self-assessment-adjustment-policy';
import type {
  AdjustmentTarget,
  RecordedSelfAssessmentAdjustment,
  SelfAssessmentAdjustmentRepository,
  SelfAssessmentAdjustmentWrite,
} from '../../domain/repositories/self-assessment-adjustment.repository';
import {
  persistAdjustment,
  resolveAndReadHistory,
  toAdjustment,
} from './self-assessment-adjustment.persistence';

@Injectable()
export class PgSelfAssessmentAdjustmentRepository implements SelfAssessmentAdjustmentRepository {
  constructor(private readonly dataSource: DataSource) {}

  findHistory(sessionId: string, studentId: string, tipo?: AdjustmentTarget) {
    return this.dataSource.transaction('REPEATABLE READ', (manager) =>
      resolveAndReadHistory(manager, sessionId, studentId, false, tipo),
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
  const { sessionId, studentId, tipo } = input;
  const history = await resolveAndReadHistory(manager, sessionId, studentId, true, tipo);
  const planned = planSelfAssessmentAdjustment(history, input.newScore, input.justification, tipo);
  const row = await persistAdjustment(manager, planned, input.authorId);
  return {
    originalScore: planned.originalScore,
    adjustment: toAdjustment(row),
  };
}
