import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { AuthenticatedUserId } from '@/shared/decorators/authenticated-user-id.decorator';
import {
  AuthenticatedUser,
  type AuthenticatedUserRef,
} from '@/shared/decorators/authenticated-user.decorator';
import { Roles } from '@/shared/decorators/roles.decorator';
import { UuidParam } from '@/shared/decorators/uuid-param.decorator';
import type { MessageResponseDto } from '@/shared/dtos/message-response.dto';
import { UserType } from '@/users/domain/enums/user-type.enum';

import { AddTutorToRoomDto } from '../../application/dtos/add-tutor-to-room.dto';
import {
  TransferRoomOwnershipDto,
  type TransferRoomOwnershipResponseDto,
} from '../../application/dtos/transfer-room-ownership.dto';
import { AddTutorToRoomUseCase } from '../../application/use-cases/add-tutor-to-room.use-case';
import { RemoveTutorFromRoomUseCase } from '../../application/use-cases/remove-tutor-from-room.use-case';
import { TransferRoomOwnershipUseCase } from '../../application/use-cases/transfer-room-ownership.use-case';
import {
  AddTutorToRoomSwaggerDocs,
  ListRoomTutorsSwaggerDocs,
  RemoveTutorFromRoomSwaggerDocs,
  TransferRoomOwnershipSwaggerDocs,
} from './room-tutor.swagger';

import { ListRoomTutorsUseCase } from '../../application/use-cases/list-room-tutors.use-case';
import type { RoomTutorResponseDto } from '../../application/dtos/room-tutor-response.dto';
import { toRoomTutorResponse } from './room.mapper';

const TUTOR_ADDED = 'Professor associado à sala com sucesso.';
const TUTOR_REMOVED = 'Professor removido da sala com sucesso.';

@ApiTags('Salas - Professores')
@Controller('salas')
@Roles(UserType.TUTOR)
export class RoomTutorsController {
  constructor(
    private readonly listRoomTutorsUseCase: ListRoomTutorsUseCase,
    private readonly addTutorToRoomUseCase: AddTutorToRoomUseCase,
    private readonly removeTutorFromRoomUseCase: RemoveTutorFromRoomUseCase,
    private readonly transferRoomOwnershipUseCase: TransferRoomOwnershipUseCase,
  ) {}

  @Get(':id/professores')
  @Roles(UserType.TUTOR, UserType.STUDENT)
  @ListRoomTutorsSwaggerDocs
  async listTutors(
    @UuidParam('id') roomId: string,
    @AuthenticatedUser() member: AuthenticatedUserRef,
  ): Promise<RoomTutorResponseDto[]> {
    const tutors = await this.listRoomTutorsUseCase.execute({ roomId, member });
    return tutors.map(toRoomTutorResponse);
  }

  @Post(':id/professores')
  @HttpCode(HttpStatus.CREATED)
  @AddTutorToRoomSwaggerDocs
  async addTutor(
    @UuidParam('id') roomId: string,
    @Body() dto: AddTutorToRoomDto,
    @AuthenticatedUserId() authenticatedTutorId: string,
  ): Promise<MessageResponseDto> {
    await this.addTutorToRoomUseCase.execute({
      roomId,
      authenticatedTutorId,
      tutorId: dto.professorId,
    });

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
    await this.removeTutorFromRoomUseCase.execute({ roomId, authenticatedTutorId, tutorId });

    return { mensagem: TUTOR_REMOVED };
  }

  @Patch(':salaId/proprietario')
  @HttpCode(HttpStatus.OK)
  @TransferRoomOwnershipSwaggerDocs
  async transferOwnership(
    @UuidParam('salaId') roomId: string,
    @Body() dto: TransferRoomOwnershipDto,
    @AuthenticatedUserId() authenticatedTutorId: string,
  ): Promise<TransferRoomOwnershipResponseDto> {
    const result = await this.transferRoomOwnershipUseCase.execute({
      roomId,
      authenticatedTutorId,
      newOwnerId: dto.professorId,
    });

    return {
      id: result.id,
      professorResponsavelId: result.tutorId,
    };
  }
}
