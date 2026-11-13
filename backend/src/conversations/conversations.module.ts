import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoomsModule } from '@/rooms/rooms.module';
import { UsersModule } from '@/users/users.module';
import { Conversation } from './domain/entities/conversation.entity';
import { Message } from './domain/entities/message.entity';
import { CONVERSATION_REPOSITORY } from './domain/repositories/conversation.repository';
import { MESSAGE_REPOSITORY } from './domain/repositories/message.repository';
import { PgConversationRepository } from './infrastructure/database/pg-conversation.repository';
import { PgMessageRepository } from './infrastructure/database/pg-message.repository';
import { RoomConversationsController } from './infrastructure/http/room-conversations.controller';
import { ConversationsController } from './infrastructure/http/conversations.controller';
import { GetOrCreateConversationUseCase } from './application/use-cases/get-or-create-conversation.use-case';
import { ListRoomConversationsUseCase } from './application/use-cases/list-room-conversations.use-case';
import { ListConversationMessagesUseCase } from './application/use-cases/list-conversation-messages.use-case';
import { SendMessageUseCase } from './application/use-cases/send-message.use-case';

@Module({
  imports: [TypeOrmModule.forFeature([Conversation, Message]), RoomsModule, UsersModule],
  controllers: [RoomConversationsController, ConversationsController],
  providers: [
    GetOrCreateConversationUseCase,
    ListRoomConversationsUseCase,
    ListConversationMessagesUseCase,
    SendMessageUseCase,
    {
      provide: CONVERSATION_REPOSITORY,
      useClass: PgConversationRepository,
    },
    {
      provide: MESSAGE_REPOSITORY,
      useClass: PgMessageRepository,
    },
  ],
  exports: [CONVERSATION_REPOSITORY, MESSAGE_REPOSITORY],
})
export class ConversationsModule {}
