import { ConflictError } from '@/shared/errors/application.error';
import { Inject, Injectable } from '@nestjs/common';
import { SessionAccessService } from '../services/session-access.service';
import {
  SESSION_REPOSITORY,
  SessionRepository,
} from '../../domain/repositories/session.repository';

export interface DeleteSessionInput {
  roomId: string;
  problemId: string;
  sessionId: string;
  tutorId: string;
}

@Injectable()
export class DeleteSessionUseCase {
  constructor(
    @Inject(SESSION_REPOSITORY) private readonly sessions: SessionRepository,
    private readonly access: SessionAccessService,
  ) {}

  async execute(input: DeleteSessionInput): Promise<void> {
    const session = await this.access.assertTutorCanAccessSession(
      input.roomId,
      input.problemId,
      input.sessionId,
      input.tutorId,
    );
    const impact = await this.sessions.getDeletionImpact(session.id);
    if (Object.values(impact).some((count) => count > 0)) {
      throw new ConflictError(`A sessão não pode ser excluída. Impacto: ${JSON.stringify(impact)}`);
    }
    await this.sessions.delete(session.id, input.problemId);
  }
}
