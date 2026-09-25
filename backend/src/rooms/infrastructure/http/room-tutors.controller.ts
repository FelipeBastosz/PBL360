import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';

import { ApiTags } from '@nestjs/swagger';

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
    @Param('id', new ParseUUIDPipe()) roomId: string,
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
    @Param('id', new ParseUUIDPipe()) roomId: string,
    @Param('tutorId', new ParseUUIDPipe()) tutorId: string,
    @AuthenticatedUserId() authenticatedTutorId: string,
  ): Promise<{ message: string }> {
    await this.removeTutorFromRoomUseCase.execute(roomId, authenticatedTutorId, tutorId);

    return {
      message: 'Professor removido da sala com sucesso.',
    };
  }
}
