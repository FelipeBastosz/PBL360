import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { AuthenticatedUserId } from '@/shared/decorators/authenticated-user-id.decorator';
import { Roles } from '@/shared/decorators/roles.decorator';
import { UuidParam } from '@/shared/decorators/uuid-param.decorator';
import { UserType } from '@/users/domain/enums/user-type.enum';

import { CreateRoomDto } from '../../application/dtos/create-room.dto';
import type { RoomResponseDto } from '../../application/dtos/room-response.dto';
import { UpdateRoomDto } from '../../application/dtos/update-room.dto';
import { CreateRoomUseCase } from '../../application/use-cases/create-room.use-case';
import { DeleteRoomUseCase } from '../../application/use-cases/delete-room.use-case';
import { ListRoomsUseCase } from '../../application/use-cases/list-rooms.use-case';
import { UpdateRoomUseCase } from '../../application/use-cases/update-room.use-case';
import { toRoomChanges, toRoomResponse } from './room.mapper';
import {
  CreateRoomSwaggerDocs,
  DeleteRoomSwaggerDocs,
  EditRoomSwaggerDocs,
  ListRoomSwaggerDocs,
} from './room.swagger';

@ApiTags('Salas')
@Controller('salas')
@Roles(UserType.TUTOR)
export class RoomsController {
  constructor(
    private readonly createRoomUseCase: CreateRoomUseCase,
    private readonly updateRoomUseCase: UpdateRoomUseCase,
    private readonly deleteRoomUseCase: DeleteRoomUseCase,
    private readonly listRoomsUseCase: ListRoomsUseCase,
  ) {}

  @Get()
  @ListRoomSwaggerDocs
  async list(@AuthenticatedUserId() tutorId: string): Promise<RoomResponseDto[]> {
    const rooms = await this.listRoomsUseCase.execute(tutorId);

    return rooms.map(toRoomResponse);
  }

  @Post()
  @CreateRoomSwaggerDocs
  async create(
    @Body() dto: CreateRoomDto,
    @AuthenticatedUserId() tutorId: string,
  ): Promise<RoomResponseDto> {
    const room = await this.createRoomUseCase.execute({
      tutorId,
      name: dto.nome,
      courseCode: dto.codigoDisciplina,
      semester: dto.semestre,
    });

    return toRoomResponse(room);
  }

  @Patch(':id')
  @EditRoomSwaggerDocs
  async edit(
    @UuidParam('id') roomId: string,
    @Body() dto: UpdateRoomDto,
    @AuthenticatedUserId() tutorId: string,
  ): Promise<RoomResponseDto> {
    return toRoomResponse(
      await this.updateRoomUseCase.execute(roomId, tutorId, toRoomChanges(dto)),
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @DeleteRoomSwaggerDocs
  delete(@UuidParam('id') roomId: string, @AuthenticatedUserId() tutorId: string): Promise<void> {
    return this.deleteRoomUseCase.execute(roomId, tutorId);
  }
}
