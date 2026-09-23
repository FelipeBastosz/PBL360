import {
  Body,
  Controller,
  ForbiddenException,
  Post,
  Patch,
  Param,
  UseGuards,
  Delete,
  HttpCode,
  HttpStatus,
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
import { UpdateRoomResponseDto } from '@/rooms/application/dtos/update-room-response.dto';
import { DeleteRoomUseCase } from '@/rooms/application/use-cases/delete-room.use-case';
import { DeleteRoomDto } from '@/rooms/application/dtos/delete-room.dto';
import { DeleteRoomSwaggerDocs, EditRoomSwaggerDocs } from './room.swagger';

@Controller('salas')
@UseGuards(AuthGuard, RolesGuard)
export class RoomsController {
  constructor(
    private readonly createRoomUseCase: CreateRoomUseCase,
    private readonly updateRoomUseCase: UpdateRoomUseCase,
    private readonly deleteRoomUseCase: DeleteRoomUseCase,
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

  @Roles(UserType.TUTOR)
  @EditRoomSwaggerDocs
  @Patch(':id')
  async edit(
    @Param('id') roomId: string,
    @Body() updateRoomDto: UpdateRoomDto,
  ): Promise<UpdateRoomResponseDto> {
    return this.updateRoomUseCase.execute(roomId, updateRoomDto);
  }

  @Roles(UserType.TUTOR)
  @HttpCode(HttpStatus.NO_CONTENT)
  @DeleteRoomSwaggerDocs
  @Delete(':id')
  async delete(@Param('id') roomId: string, @Body() deleteRoomDto: DeleteRoomDto): Promise<void> {
    return this.deleteRoomUseCase.execute(roomId, deleteRoomDto);
  }
}
