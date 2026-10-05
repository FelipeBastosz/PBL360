import { Inject, Injectable } from '@nestjs/common';
import {
  RoomAccessService,
  type RoomMember,
} from '@/rooms/application/services/room-access.service';
import {
  ROOM_SESSION_REPOSITORY,
  type RoomSessionRepository,
  type RoomSessionSummary,
} from '../../domain/repositories/room-session.repository';

@Injectable()
export class ListRoomSessionsUseCase {
  constructor(
    private readonly roomAccess: RoomAccessService,
    @Inject(ROOM_SESSION_REPOSITORY) private readonly roomSessions: RoomSessionRepository,
  ) {}

  async execute(roomId: string, member: RoomMember): Promise<RoomSessionSummary[]> {
    await this.roomAccess.assertMemberCanAccessRoom(roomId, member);
    return this.roomSessions.findByRoom(roomId);
  }
}
