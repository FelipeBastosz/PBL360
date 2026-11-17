import { Inject, Injectable } from '@nestjs/common';
import { RoomAccessService } from '@/rooms/application/services/room-access.service';
import type { UserType } from '@/users/domain/enums/user-type.enum';
import {
  CONVERSATION_REPOSITORY,
  type ConversationListItem,
  type ConversationRepository,
} from '../../domain/repositories/conversation.repository';

export interface ListRoomConversationsInput {
  roomId: string;
  authenticatedUser: {
    id: string;
    type: UserType;
  };
}

@Injectable()
export class ListRoomConversationsUseCase {
  constructor(
    @Inject(CONVERSATION_REPOSITORY)
    private readonly conversations: ConversationRepository,
    private readonly roomAccess: RoomAccessService,
  ) {}

  async execute(input: ListRoomConversationsInput): Promise<ConversationListItem[]> {
    const { roomId, authenticatedUser } = input;

    await this.roomAccess.assertMemberCanAccessRoom(roomId, authenticatedUser);

    return this.conversations.listByRoomAndUser(roomId, authenticatedUser.id);
  }
}
