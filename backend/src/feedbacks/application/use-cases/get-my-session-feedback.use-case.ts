import { Inject, Injectable } from '@nestjs/common';
import { SessionAccessService } from '@/sessions/application/services/session-access.service';
import { UserType } from '@/users/domain/enums/user-type.enum';
import {
  RECEIVED_FEEDBACK_REPOSITORY,
  type ReceivedFeedbackRepository,
} from '../../domain/repositories/received-feedback.repository';

@Injectable()
export class GetMySessionFeedbackUseCase {
  constructor(
    private readonly access: SessionAccessService,
    @Inject(RECEIVED_FEEDBACK_REPOSITORY) private readonly feedbacks: ReceivedFeedbackRepository,
  ) {}

  async execute(sessionId: string, studentId: string) {
    await this.access.assertMemberCanAccessSession(sessionId, {
      id: studentId,
      type: UserType.STUDENT,
    });
    return this.feedbacks.readSession(sessionId, studentId);
  }
}
