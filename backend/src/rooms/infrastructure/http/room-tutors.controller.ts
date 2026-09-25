import { Body, Controller, Delete, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { AuthenticatedUserId } from '@/shared/decorators/authenticated-user-id.decorator';
import { Roles } from '@/shared/decorators/roles.decorator';
import { UuidParam } from '@/shared/decorators/uuid-param.decorator';
import type { MessageResponseDto } from '@/shared/dtos/message-response.dto';
import { UserType } from '@/users/domain/enums/user-type.enum';

import { AddTutorToRoomDto } from '../../application/dtos/add-tutor-to-room.dto';
import { AddTutorToRoomUseCase } from '../../application/use-cases/add-tutor-to-room.use-case';
import { RemoveTutorFromRoomUseCase } from '../../application/use-cases/remove-tutor-from-room.use-case';
import { AddTutorToRoomSwaggerDocs, RemoveTutorFromRoomSwaggerDocs } from './room-tutor.swagger';

const TUTOR_ADDED = 'Professor associado à sala com sucesso.';
const TUTOR_REMOVED = 'Professor removido da sala com sucesso.';

@ApiTags('Salas - Professores')
@Controller('salas')
@Roles(UserType.TUTOR)
export class RoomTutorsController {
  constructor(
    private readonly addTutorToRoomUseCase: AddTutorToRoomUseCase,
    private readonly removeTutorFromRoomUseCase: RemoveTutorFromRoomUseCase,
  ) {}

  @Post(':id/professores')
  @HttpCode(HttpStatus.CREATED)
  @AddTutorToRoomSwaggerDocs
  async addTutor(
    @UuidParam('id') roomId: string,
    @Body() dto: AddTutorToRoomDto,
    @AuthenticatedUserId() authenticatedTutorId: string,
  ): Promise<MessageResponseDto> {
    await this.addTutorToRoomUseCase.execute(roomId, authenticatedTutorId, dto.professorId);

    return { mensagem: TUTOR_ADDED };
  }

  @Delete(':id/professores/:professorId')
  @HttpCode(HttpStatus.OK)
  @RemoveTutorFromRoomSwaggerDocs
  async removeTutor(
    @UuidParam('id') roomId: string,
    @UuidParam('professorId') tutorId: string,
    @AuthenticatedUserId() authenticatedTutorId: string,
  ): Promise<MessageResponseDto> {
    await this.removeTutorFromRoomUseCase.execute(roomId, authenticatedTutorId, tutorId);

    return { mensagem: TUTOR_REMOVED };
  }
}
