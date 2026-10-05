import { Injectable } from '@nestjs/common';
import type { RoomMember } from '@/rooms/application/services/room-access.service';
import type { Problem } from '@/problems/domain/entities/problem.entity';
import type { Session } from '../../domain/entities/session.entity';
import { SessionAccessService } from '../services/session-access.service';

@Injectable()
export class GetMemberSessionUseCase {
  constructor(private readonly access: SessionAccessService) {}

  execute(
    sessionId: string,
    member: RoomMember,
  ): Promise<{ session: Session; problem: Problem; roomId: string }> {
    return this.access.assertMemberCanAccessSession(sessionId, member);
  }
}
