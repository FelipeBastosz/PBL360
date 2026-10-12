import { Inject, Injectable } from '@nestjs/common';
import {
  SELF_ASSESSMENT_ADJUSTMENT_REPOSITORY,
  type SelfAssessmentAdjustmentRepository,
  type SelfAssessmentAdjustmentWrite,
} from '../../domain/repositories/self-assessment-adjustment.repository';
import { EvaluationAccessService } from '../services/evaluation-access.service';
import type { AdjustedSelfAssessmentOutput } from '../services/self-assessment-adjustment-policy';

@Injectable()
export class AdjustSelfAssessmentUseCase {
  constructor(
    private readonly access: EvaluationAccessService,
    @Inject(SELF_ASSESSMENT_ADJUSTMENT_REPOSITORY)
    private readonly adjustments: SelfAssessmentAdjustmentRepository,
  ) {}

  async execute(input: SelfAssessmentAdjustmentWrite): Promise<AdjustedSelfAssessmentOutput> {
    await this.access.forStudent(input.sessionId, input.studentId, input.authorId);
    const { originalScore, adjustment } = await this.adjustments.record(input);
    return { originalScore, currentScore: adjustment.newValue, adjustment };
  }
}
