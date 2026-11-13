import { Body, Controller, Get, HttpStatus, Post, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import {
  AuthenticatedUser,
  type AuthenticatedUserRef,
} from '@/shared/decorators/authenticated-user.decorator';
import { Roles } from '@/shared/decorators/roles.decorator';
import { UuidParam } from '@/shared/decorators/uuid-param.decorator';
import { UserType } from '@/users/domain/enums/user-type.enum';
import { CreateConversationDto } from '../../application/dtos/create-conversation.dto';
import type { ConversationResponseDto } from '../../application/dtos/conversation-response.dto';
import { GetOrCreateConversationUseCase } from '../../application/use-cases/get-or-create-conversation.use-case';
import { ListRoomConversationsUseCase } from '../../application/use-cases/list-room-conversations.use-case';
import { toConversationResponse, toInterlocutorResponse } from './conversation.mapper';
import {
  CreateConversationSwaggerDocs,
  ListRoomConversationsSwaggerDocs,
} from './conversations.swagger';

@ApiTags('Conversas')
@Controller('salas/:salaId/conversas')
@Roles(UserType.TUTOR, UserType.STUDENT)
export class RoomConversationsController {
  constructor(
    private readonly listRoomConversations: ListRoomConversationsUseCase,
    private readonly getOrCreateConversation: GetOrCreateConversationUseCase,
  ) {}

  @Get()
  @ListRoomConversationsSwaggerDocs
  async list(
    @UuidParam('salaId') roomId: string,
    @AuthenticatedUser() user: AuthenticatedUserRef,
  ): Promise<ConversationResponseDto[]> {
    const conversations = await this.listRoomConversations.execute({
      roomId,
      authenticatedUser: { id: user.id, type: user.type },
    });

    return conversations.map(toConversationResponse);
  }

  @Post()
  @CreateConversationSwaggerDocs
  async createOrGet(
    @UuidParam('salaId') roomId: string,
    @Body() dto: CreateConversationDto,
    @AuthenticatedUser() user: AuthenticatedUserRef,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ConversationResponseDto> {
    const result = await this.getOrCreateConversation.execute({
      roomId,
      authenticatedUser: { id: user.id, type: user.type },
      destinatarioId: dto.destinatarioId,
    });

    res.status(result.created ? HttpStatus.CREATED : HttpStatus.OK);

    return {
      id: result.conversation.id,
      interlocutor: toInterlocutorResponse(result.interlocutor),
      ultimaMensagem: null,
    };
  }
}
