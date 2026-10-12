import { Inject, Injectable } from '@nestjs/common';
import { SessionAccessService } from '@/sessions/application/services/session-access.service';
import { UserType } from '@/users/domain/enums/user-type.enum';
import {
  FEEDBACK_REPOSITORY,
  type FeedbackRepository,
} from '@/feedbacks/domain/repositories/feedback.repository';
import {
  EVALUATION_REPOSITORY,
  type EvaluationRepository,
} from '../../domain/repositories/evaluation.repository';
import { toStudentEvaluationSummary } from '../services/student-evaluation-summary';

@Injectable()
export class GetStudentEvaluationSummaryUseCase {
  constructor(
    private readonly sessionAccess: SessionAccessService,
    @Inject(EVALUATION_REPOSITORY) private readonly evaluations: EvaluationRepository,
    @Inject(FEEDBACK_REPOSITORY) private readonly feedbacks: FeedbackRepository,
  ) {}

  async execute(sessionId: string, studentId: string, now = new Date()) {
    const access = await this.sessionAccess.assertMemberCanAccessSession(sessionId, {
      id: studentId,
      type: UserType.STUDENT,
    });
    const context = { sessionId, problemId: access.problem.id, roomId: access.roomId };
    const [counts, detail, feedback] = await Promise.all([
      this.evaluations.getStudentEvaluationSummary(context, studentId),
      this.evaluations.getSelfAssessment(context, studentId),
      this.feedbacks.findStudentSessionFeedback(sessionId, studentId),
    ]);
    const readAt = feedback
      ? await this.feedbacks.findStudentSessionFeedbackReadAt(feedback.id, studentId)
      : null;
    const updatedAt = feedback?.editedAt ?? feedback?.createdAt ?? null;
    const feedbackIsNew =
      feedback !== null && (readAt === null || (updatedAt !== null && updatedAt > readAt));
    return toStudentEvaluationSummary(access.session, counts, detail, feedback, feedbackIsNew, now);
  }
}
