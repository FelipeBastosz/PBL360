import { Inject, Injectable } from '@nestjs/common';
import { RoomAccessService } from '@/rooms/application/services/room-access.service';
import {
  PROBLEM_REPOSITORY,
  type ProblemRepository,
} from '@/problems/domain/repositories/problem.repository';
import {
  SESSION_REPOSITORY,
  type SessionRepository,
} from '@/sessions/domain/repositories/session.repository';
import { NotFoundError } from '@/shared/errors/application.error';
import {
  FEEDBACK_REPOSITORY,
  type FeedbackRepository,
} from '../../domain/repositories/feedback.repository';
import type { Feedback } from '../../domain/entities/feedback.entity';

export interface GetSessionFeedbackInput {
  sessionId: string;
  studentId: string;
  tutorId: string;
}

@Injectable()
export class GetSessionFeedbackUseCase {
  constructor(
    @Inject(FEEDBACK_REPOSITORY)
    private readonly feedbackRepository: FeedbackRepository,
    @Inject(SESSION_REPOSITORY)
    private readonly sessionRepository: SessionRepository,
    @Inject(PROBLEM_REPOSITORY)
    private readonly problemRepository: ProblemRepository,
    private readonly roomAccessService: RoomAccessService,
  ) {}

  async execute(input: GetSessionFeedbackInput): Promise<Feedback | null> {
    await this.validateSessionAndAccess(input.sessionId, input.tutorId);

    return this.feedbackRepository.findStudentSessionFeedback(input.sessionId, input.studentId);
  }

  private async validateSessionAndAccess(sessionId: string, tutorId: string): Promise<void> {
    const session = await this.sessionRepository.findById(sessionId);
    if (!session) {
      throw new NotFoundError('Sessão não encontrada.');
    }

    const problem = await this.problemRepository.findById(session.problemId);
    if (!problem) {
      throw new NotFoundError('Problema não encontrado.');
    }

    await this.roomAccessService.assertTutorCanAccessRoom(problem.roomId, tutorId);
  }
}
