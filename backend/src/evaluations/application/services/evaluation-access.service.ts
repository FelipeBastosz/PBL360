import { Inject, Injectable } from '@nestjs/common';
import { SessionAccessService } from '@/sessions/application/services/session-access.service';
import { UnprocessableEntityError } from '@/shared/errors/application.error';
import {
  EVALUATION_REPOSITORY,
  type EvaluationRepository,
} from '../../domain/repositories/evaluation.repository';

@Injectable()
export class EvaluationAccessService {
  constructor(
    private readonly sessions: SessionAccessService,
    @Inject(EVALUATION_REPOSITORY) private readonly evaluations: EvaluationRepository,
  ) {}

  async forSession(sessionId: string, authorId: string) {
    const { session, roomId } = await this.sessions.assertTutorCanAccessSessionById(
      sessionId,
      authorId,
    );
    return { sessionId: session.id, problemId: session.problemId, roomId };
  }

  async forStudent(sessionId: string, studentId: string, authorId: string) {
    const context = await this.forSession(sessionId, authorId);
    if (!(await this.evaluations.isEnrolled(context.roomId, studentId))) {
      throw new UnprocessableEntityError('O aluno não está matriculado na sala.');
    }
    return context;
  }
}
