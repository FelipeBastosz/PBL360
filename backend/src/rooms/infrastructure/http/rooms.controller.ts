import { Body, Controller, ForbiddenException, Post, UseGuards } from '@nestjs/common';

import { AuthenticatedUserId } from '@/shared/decorators/authenticated-user-id.decorator';
import { Roles } from '@/shared/decorators/roles.decorator';
import { AuthGuard } from '@/shared/guards/auth.guard';
import { RolesGuard } from '@/shared/guards/roles.guard';
import { UserType } from '@/users/domain/enums/user-type.enum';

import { CreateRoomDto } from '../../application/dtos/create-room.dto';
import { CreateRoomUseCase } from '../../application/use-cases/create-room.use-case';

@Controller('salas')
@UseGuards(AuthGuard, RolesGuard)
export class RoomsController {
  constructor(private readonly createRoomUseCase: CreateRoomUseCase) {}

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
}
