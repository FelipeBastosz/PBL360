import { Inject, Injectable } from '@nestjs/common';
import { SessionAccessService } from '../services/session-access.service';
import {
  SESSION_REPOSITORY,
  SessionRepository,
} from '../../domain/repositories/session.repository';

export interface GetSessionDeletionImpactInput {
  roomId: string;
  problemId: string;
  sessionId: string;
  tutorId: string;
}

export interface GetSessionDeletionImpactOutput {
  canDelete: boolean;
  rollCall: number;
  roles: number;
  observations: number;
  evaluations: number;
  feedbacks: number;
}

@Injectable()
export class GetSessionDeletionImpactUseCase {
  constructor(
    @Inject(SESSION_REPOSITORY) private readonly sessions: SessionRepository,
    private readonly access: SessionAccessService,
  ) {}

  async execute(input: GetSessionDeletionImpactInput): Promise<GetSessionDeletionImpactOutput> {
    const session = await this.access.assertTutorCanAccessSession(
      input.roomId,
      input.problemId,
      input.sessionId,
      input.tutorId,
    );
    const impact = await this.sessions.getDeletionImpact(session.id);
    return {
      canDelete: Object.values(impact).every((count) => count === 0),
      rollCall: impact.chamada,
      roles: impact.papeis,
      observations: impact.observacoes,
      evaluations: impact.avaliacoes,
      feedbacks: impact.feedbacks,
    };
  }
}
