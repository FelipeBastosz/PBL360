import { Inject, Injectable } from '@nestjs/common';
import {
  SELF_ASSESSMENT_ADJUSTMENT_REPOSITORY,
  type SelfAssessmentAdjustmentRepository,
} from '../../domain/repositories/self-assessment-adjustment.repository';
import { EvaluationAccessService } from '../services/evaluation-access.service';
import {
  summarizeSelfAssessmentAdjustments,
  type SelfAssessmentAdjustmentsOutput,
} from '../services/self-assessment-adjustment-policy';

@Injectable()
export class ListSelfAssessmentAdjustmentsUseCase {
  constructor(
    private readonly access: EvaluationAccessService,
    @Inject(SELF_ASSESSMENT_ADJUSTMENT_REPOSITORY)
    private readonly adjustments: SelfAssessmentAdjustmentRepository,
  ) {}

  async execute(
    sessionId: string,
    studentId: string,
    authorId: string,
  ): Promise<SelfAssessmentAdjustmentsOutput> {
    await this.access.forStudent(sessionId, studentId, authorId);
    const history = await this.adjustments.findHistory(sessionId, studentId);
    return summarizeSelfAssessmentAdjustments(history);
  }
}
