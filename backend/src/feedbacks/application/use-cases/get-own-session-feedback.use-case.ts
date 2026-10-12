import { Inject, Injectable } from '@nestjs/common';
import { UserType } from '@/users/domain/enums/user-type.enum';
import { SessionAccessService } from '@/sessions/application/services/session-access.service';
import {
  FEEDBACK_REPOSITORY,
  type FeedbackRepository,
} from '../../domain/repositories/feedback.repository';
import type { Feedback } from '../../domain/entities/feedback.entity';

@Injectable()
export class GetOwnSessionFeedbackUseCase {
  constructor(
    private readonly sessionAccess: SessionAccessService,
    @Inject(FEEDBACK_REPOSITORY) private readonly feedbacks: FeedbackRepository,
  ) {}

  async execute(sessionId: string, studentId: string, now = new Date()): Promise<Feedback | null> {
    await this.sessionAccess.assertMemberCanAccessSession(sessionId, {
      id: studentId,
      type: UserType.STUDENT,
    });
    const feedback = await this.feedbacks.findStudentSessionFeedback(sessionId, studentId);
    if (feedback) {
      await this.feedbacks.markStudentSessionFeedbackRead(feedback.id, studentId, now);
    }
    return feedback;
  }
}
