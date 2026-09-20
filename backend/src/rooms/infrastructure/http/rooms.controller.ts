import {
  Body,
  Controller,
  ForbiddenException,
<<<<<<< HEAD
  Param,
  Patch,
  Post,
=======
  Post,
  Patch,
  Param,
>>>>>>> 8c514a9a2c4246350c86c610b949378e0035d94b
  UseGuards,
} from '@nestjs/common';

import { AuthenticatedUserId } from '@/shared/decorators/authenticated-user-id.decorator';
import { Roles } from '@/shared/decorators/roles.decorator';
import { AuthGuard } from '@/shared/guards/auth.guard';
import { RolesGuard } from '@/shared/guards/roles.guard';
import { UserType } from '@/users/domain/enums/user-type.enum';

import { CreateRoomDto } from '../../application/dtos/create-room.dto';
import { UpdateRoomDto } from '../../application/dtos/update-room.dto';
import { CreateRoomUseCase } from '../../application/use-cases/create-room.use-case';
<<<<<<< HEAD
import { UpdateRoomDto } from '@/rooms/application/dtos/update-room.dto';
import { UpdateRoomUseCase } from '@/rooms/application/use-cases/update-room.use-case';
=======
import { UpdateRoomUseCase } from '../../application/use-cases/update-room.use-case';
>>>>>>> 8c514a9a2c4246350c86c610b949378e0035d94b

@Controller('salas')
@UseGuards(AuthGuard, RolesGuard)
export class RoomsController {
  constructor(
    private readonly createRoomUseCase: CreateRoomUseCase,
<<<<<<< HEAD
    private readonly editRoomUseCase: UpdateRoomUseCase,
=======
    private readonly updateRoomUseCase: UpdateRoomUseCase,
>>>>>>> 8c514a9a2c4246350c86c610b949378e0035d94b
  ) {}

  @Post()
  @Roles(UserType.TUTOR)
  create(@Body() dto: CreateRoomDto, @AuthenticatedUserId() authenticatedTutorId: string) {
    if (dto.tutorId !== authenticatedTutorId) {
      throw new ForbiddenException('Não é permitido criar uma sala em nome de outro professor.');
    }

    return this.createRoomUseCase.execute({
      tutorId: dto.tutorId,
      name: dto.nome,
      semester: dto.semestre,
    });
  }

  @Patch(':id')
<<<<<<< HEAD
  @UseGuards(AuthGuard)
  async edit(
    @Param('id') roomId: string,
    @Body() editRoomDto: UpdateRoomDto,
    @AuthenticatedUserId() tutorId: string,
  ) {
    // Repassa o ID da sala, o ID do tutor autenticado e os dados (nome, semestre, ativo)
    const updatedRoom = await this.editRoomUseCase.execute(roomId, tutorId, editRoomDto);
=======
  @Roles(UserType.TUTOR)
  async edit(
    @Param('id') roomId: string,
    @Body() updateRoomDto: UpdateRoomDto,
    @AuthenticatedUserId() tutorId: string,
  ) {
    // Passes the room ID, the authenticated tutor's ID, and the data (name, semester, active status)
    const updatedRoom = await this.updateRoomUseCase.execute(roomId, tutorId, updateRoomDto);
>>>>>>> 8c514a9a2c4246350c86c610b949378e0035d94b

    return {
      message: 'Sala atualizada com sucesso',
      data: updatedRoom,
    };
  }
}
