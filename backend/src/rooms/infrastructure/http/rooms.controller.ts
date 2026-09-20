import {
  Body,
  Controller,
  ForbiddenException,
  Post,
  Patch,
  Param,
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
import { UpdateRoomUseCase } from '../../application/use-cases/update-room.use-case';

@Controller('salas')
@UseGuards(AuthGuard, RolesGuard)
export class RoomsController {
  constructor(
    private readonly createRoomUseCase: CreateRoomUseCase,
    private readonly updateRoomUseCase: UpdateRoomUseCase,
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
  @Roles(UserType.TUTOR)
  async edit(
    @Param('id') roomId: string,
    @Body() updateRoomDto: UpdateRoomDto,
    @AuthenticatedUserId() tutorId: string,
  ) {
    // Passes the room ID, the authenticated tutor's ID, and the data (name, semester, active status)
    const updatedRoom = await this.updateRoomUseCase.execute(roomId, tutorId, updateRoomDto);

    return {
      message: 'Sala atualizada com sucesso',
      data: updatedRoom,
    };
  }
}
