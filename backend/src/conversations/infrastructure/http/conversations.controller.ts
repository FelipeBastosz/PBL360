import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import { IdentityThrottlerGuard } from '@/shared/throttling/identity-throttler.guard';
import {
  AUTH_THROTTLER,
  MESSAGE_SEND_LIMIT,
  ROOM_ENTRY_THROTTLER,
} from '@/shared/throttling/throttlers';
import {
  AuthenticatedUser,
  type AuthenticatedUserRef,
} from '@/shared/decorators/authenticated-user.decorator';
import { Roles } from '@/shared/decorators/roles.decorator';
import { UuidParam } from '@/shared/decorators/uuid-param.decorator';
import { UserType } from '@/users/domain/enums/user-type.enum';
import { ListMessagesQueryDto } from '../../application/dtos/list-messages-query.dto';
import { SendMessageDto } from '../../application/dtos/send-message.dto';
import type {
  MessageResponseDto,
  MessagesListResponseDto,
} from '../../application/dtos/message-response.dto';
import { ListConversationMessagesUseCase } from '../../application/use-cases/list-conversation-messages.use-case';
import { SendMessageUseCase } from '../../application/use-cases/send-message.use-case';
import { toMessageResponse, toMessagesListResponse } from './conversation.mapper';
import {
  ListConversationMessagesSwaggerDocs,
  SendMessageSwaggerDocs,
} from './conversations.swagger';

@ApiTags('Conversas')
@Controller('conversas')
@Roles(UserType.TUTOR, UserType.STUDENT)
export class ConversationsController {
  constructor(
    private readonly listConversationMessages: ListConversationMessagesUseCase,
    private readonly sendMessage: SendMessageUseCase,
  ) {}

  @Get(':conversaId/mensagens')
  @ListConversationMessagesSwaggerDocs
  async listMessages(
    @UuidParam('conversaId') conversationId: string,
    @Query() query: ListMessagesQueryDto,
    @AuthenticatedUser() user: AuthenticatedUserRef,
  ): Promise<MessagesListResponseDto> {
    const result = await this.listConversationMessages.execute({
      conversationId,
      authenticatedUser: { id: user.id, type: user.type },
      query: {
        cursor: query.cursor,
        afterId: query.apos,
        limit: query.limite,
      },
    });

    return toMessagesListResponse(result.messages, result.nextCursor);
  }

  @Post(':conversaId/mensagens')
  @HttpCode(HttpStatus.CREATED)
  @SendMessageSwaggerDocs
  @UseGuards(IdentityThrottlerGuard)
  @Throttle(MESSAGE_SEND_LIMIT)
  @SkipThrottle({ [AUTH_THROTTLER]: true, [ROOM_ENTRY_THROTTLER]: true })
  async send(
    @UuidParam('conversaId') conversationId: string,
    @Body() dto: SendMessageDto,
    @AuthenticatedUser() user: AuthenticatedUserRef,
  ): Promise<MessageResponseDto> {
    const message = await this.sendMessage.execute({
      conversationId,
      authenticatedUser: { id: user.id, type: user.type },
      text: dto.texto,
    });

    return toMessageResponse(message);
  }
}
