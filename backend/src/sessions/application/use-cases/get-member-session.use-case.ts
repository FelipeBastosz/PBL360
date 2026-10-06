import { Injectable } from '@nestjs/common';
import type { RoomMember } from '@/rooms/application/services/room-access.service';
import type { Problem } from '@/problems/domain/entities/problem.entity';
import type { Session } from '../../domain/entities/session.entity';
import { SessionAccessService } from '../services/session-access.service';

export interface GetMemberSessionInput {
  sessionId: string;
  member: RoomMember;
}

export interface GetMemberSessionOutput {
  session: Session;
  problem: Problem;
  roomId: string;
}

@Injectable()
export class GetMemberSessionUseCase {
  constructor(private readonly access: SessionAccessService) {}

  execute({ sessionId, member }: GetMemberSessionInput): Promise<GetMemberSessionOutput> {
    return this.access.assertMemberCanAccessSession(sessionId, member);
  }
}
