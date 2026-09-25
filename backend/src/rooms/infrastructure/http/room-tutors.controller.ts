import { Body, Controller, Delete, HttpCode, HttpStatus, Post } from '@nestjs/common';

import { ApiTags } from '@nestjs/swagger';

import { UuidParam } from '@/shared/decorators/uuid-param.decorator';
import { AuthenticatedUserId } from '@/shared/decorators/authenticated-user-id.decorator';
import { Roles } from '@/shared/decorators/roles.decorator';
import { UserType } from '@/users/domain/enums/user-type.enum';

import { AddTutorToRoomDto } from '../../application/dtos/add-tutor-to-room.dto';
import { AddTutorToRoomUseCase } from '../../application/use-cases/add-tutor-to-room.use-case';
import { RemoveTutorFromRoomUseCase } from '../../application/use-cases/remove-tutor-from-room.use-case';
import { AddTutorToRoomSwaggerDocs, RemoveTutorFromRoomSwaggerDocs } from './room-tutor.swagger';

@ApiTags('Salas - Professores')
@Controller('salas')
export class RoomTutorsController {
  constructor(
    private readonly addTutorToRoomUseCase: AddTutorToRoomUseCase,
    private readonly removeTutorFromRoomUseCase: RemoveTutorFromRoomUseCase,
  ) {}

  @Post(':id/professores')
  @Roles(UserType.TUTOR)
  @AddTutorToRoomSwaggerDocs
  @HttpCode(HttpStatus.OK)
  async addTutor(
    @UuidParam('id') roomId: string,
    @Body() dto: AddTutorToRoomDto,
    @AuthenticatedUserId() authenticatedTutorId: string,
  ): Promise<{ message: string }> {
    await this.addTutorToRoomUseCase.execute(roomId, authenticatedTutorId, dto.tutorId);

    return {
      message: 'Professor associado à sala com sucesso.',
    };
  }

  @Delete(':id/professores/:tutorId')
  @Roles(UserType.TUTOR)
  @RemoveTutorFromRoomSwaggerDocs
  @HttpCode(HttpStatus.OK)
  async removeTutor(
    @UuidParam('id') roomId: string,
    @UuidParam('tutorId') tutorId: string,
    @AuthenticatedUserId() authenticatedTutorId: string,
  ): Promise<{ message: string }> {
    await this.removeTutorFromRoomUseCase.execute(roomId, authenticatedTutorId, tutorId);

    return {
      message: 'Professor removido da sala com sucesso.',
    };
  }
}
