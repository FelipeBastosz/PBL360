import { Inject, Injectable } from '@nestjs/common';
import {
  ROOM_REPOSITORY,
  type RoomRepository,
  type RoomTutor,
} from '@/rooms/domain/repositories/room.repository';
import { RoomAccessService, type RoomMember } from '../services/room-access.service';

export interface ListRoomTutorsInput {
  roomId: string;
  member: RoomMember;
}

@Injectable()
export class ListRoomTutorsUseCase {
  constructor(
    @Inject(ROOM_REPOSITORY)
    private readonly roomRepository: RoomRepository,
    private readonly roomAccessService: RoomAccessService,
  ) {}

  // Linked tutors and students enrolled in the room can see who teaches it.
  async execute({ roomId, member }: ListRoomTutorsInput): Promise<RoomTutor[]> {
    await this.roomAccessService.assertMemberCanAccessRoom(roomId, member);
    return this.roomRepository.listTutors(roomId);
  }
}
