import { Injectable } from '@nestjs/common';
import { SessionAccessService } from '../services/session-access.service';
import { Session } from '../../domain/entities/session.entity';

export interface GetSessionInput {
  roomId: string;
  problemId: string;
  sessionId: string;
  tutorId: string;
}

@Injectable()
export class GetSessionUseCase {
  constructor(private readonly access: SessionAccessService) {}

  execute(input: GetSessionInput): Promise<Session> {
    return this.access.assertTutorCanAccessSession(
      input.roomId,
      input.problemId,
      input.sessionId,
      input.tutorId,
    );
  }
}
