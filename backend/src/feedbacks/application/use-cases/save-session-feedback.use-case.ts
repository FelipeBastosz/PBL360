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
import { NotFoundError, UnprocessableEntityError } from '@/shared/errors/application.error';
import {
  FEEDBACK_REPOSITORY,
  type FeedbackRepository,
} from '../../domain/repositories/feedback.repository';
import { Feedback } from '../../domain/entities/feedback.entity';
import { FeedbackScope } from '../../domain/enums/feedback-scope.enum';
import type { Session } from '@/sessions/domain/entities/session.entity';

export interface SaveSessionFeedbackInput {
  sessionId: string;
  studentId: string;
  tutorId: string;
  text: string;
}

@Injectable()
export class SaveSessionFeedbackUseCase {
  constructor(
    @Inject(FEEDBACK_REPOSITORY)
    private readonly feedbackRepository: FeedbackRepository,
    @Inject(SESSION_REPOSITORY)
    private readonly sessionRepository: SessionRepository,
    @Inject(PROBLEM_REPOSITORY)
    private readonly problemRepository: ProblemRepository,
    private readonly roomAccessService: RoomAccessService,
  ) {}

  async execute(input: SaveSessionFeedbackInput): Promise<Feedback | null> {
    const session = await this.validateSessionAndAccess(input);
    const existing = await this.feedbackRepository.findStudentSessionFeedback(
      input.sessionId,
      input.studentId,
    );
    const trimmedText = input.text.trim();

    if (trimmedText === '') {
      if (existing) await this.feedbackRepository.deleteById(existing.id);
      return null;
    }

    if (existing) {
      const revision = existing.update(null, trimmedText, input.tutorId);
      return this.feedbackRepository.saveWithRevision(existing, revision);
    }

    return this.createFeedback(session.problemId, input, trimmedText);
  }

  private createFeedback(
    problemId: string,
    input: SaveSessionFeedbackInput,
    text: string,
  ): Promise<Feedback> {
    const feedback = Feedback.create({
      authorId: input.tutorId,
      problemId,
      sessionId: input.sessionId,
      recipientId: input.studentId,
      scope: FeedbackScope.SESSION,
      text,
    });
    return this.feedbackRepository.saveWithRevision(feedback, null);
  }

  private async validateSessionAndAccess(input: SaveSessionFeedbackInput): Promise<Session> {
    const session = await this.sessionRepository.findById(input.sessionId);
    if (!session) {
      throw new NotFoundError('Sessão não encontrada.');
    }

    const problem = await this.problemRepository.findById(session.problemId);
    if (!problem) {
      throw new NotFoundError('Problema não encontrado.');
    }

    await this.roomAccessService.assertTutorCanAccessRoom(problem.roomId, input.tutorId);

    const isEnrolled = await this.feedbackRepository.isStudentEnrolledInRoom(
      problem.roomId,
      input.studentId,
    );
    if (!isEnrolled) {
      throw new UnprocessableEntityError('O aluno não está matriculado nesta sala.');
    }

    return session;
  }
}
