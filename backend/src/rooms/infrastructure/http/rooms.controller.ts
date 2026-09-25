import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
} from '@nestjs/common';

import { ApiTags } from '@nestjs/swagger';

import { UuidParam } from '@/shared/decorators/uuid-param.decorator';
import { AuthenticatedUserId } from '@/shared/decorators/authenticated-user-id.decorator';

import { Roles } from '@/shared/decorators/roles.decorator';

import { UserType } from '@/users/domain/enums/user-type.enum';

import { CreateRoomDto } from '../../application/dtos/create-room.dto';

import { UpdateRoomDto } from '../../application/dtos/update-room.dto';

import { UpdateRoomResponseDto } from '../../application/dtos/update-room-response.dto';

import { DeleteRoomDto } from '../../application/dtos/delete-room.dto';

import { CreateRoomUseCase } from '../../application/use-cases/create-room.use-case';

import { UpdateRoomUseCase } from '../../application/use-cases/update-room.use-case';

import { DeleteRoomUseCase } from '../../application/use-cases/delete-room.use-case';

import {
  CreateRoomSwaggerDocs,
  DeleteRoomSwaggerDocs,
  EditRoomSwaggerDocs,
  ListRoomSwaggerDocs,
} from './room.swagger';

import { ListRoomsUseCase, type ListedRoom } from '../../application/use-cases/list-rooms.use-case';

@ApiTags('Salas')
@Controller('salas')
export class RoomsController {
  constructor(
    private readonly createRoomUseCase: CreateRoomUseCase,
    private readonly updateRoomUseCase: UpdateRoomUseCase,
    private readonly deleteRoomUseCase: DeleteRoomUseCase,
    private readonly listRoomsUseCase: ListRoomsUseCase,
  ) {}

  @Get()
  @Roles(UserType.TUTOR)
  @ListRoomSwaggerDocs
  list(@AuthenticatedUserId() tutorId: string): Promise<ListedRoom[]> {
    return this.listRoomsUseCase.execute(tutorId);
  }

  @Post()
  @Roles(UserType.TUTOR)
  @CreateRoomSwaggerDocs
  create(@Body() dto: CreateRoomDto, @AuthenticatedUserId() authenticatedTutorId: string) {
    if (dto.tutorId !== authenticatedTutorId) {
      throw new ForbiddenException('Não é permitido criar uma sala em nome de outro professor.');
    }

    return this.createRoomUseCase.execute({
      tutorId: dto.tutorId,
      name: dto.nome,
      courseCode: dto.codigoDisciplina,
      semester: dto.semestre,
    });
  }

  @Patch(':id')
  @Roles(UserType.TUTOR)
  @EditRoomSwaggerDocs
  async edit(
    @UuidParam('id') roomId: string,
    @Body() updateRoomDto: UpdateRoomDto,
    @AuthenticatedUserId() authenticatedTutorId: string,
  ): Promise<UpdateRoomResponseDto> {
    return this.updateRoomUseCase.execute(roomId, authenticatedTutorId, updateRoomDto);
  }

  @Delete(':id')
  @Roles(UserType.TUTOR)
  @HttpCode(HttpStatus.NO_CONTENT)
  @DeleteRoomSwaggerDocs
  async delete(
    @UuidParam('id') roomId: string,
    @Body() deleteRoomDto: DeleteRoomDto,
  ): Promise<void> {
    return this.deleteRoomUseCase.execute(roomId, deleteRoomDto);
  }
}
