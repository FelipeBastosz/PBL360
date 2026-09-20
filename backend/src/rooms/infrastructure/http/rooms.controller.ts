import { Body, Controller, Post, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import type { Request } from 'express';

import { Roles } from '@/shared/decorators/roles.decorator';
import { AuthGuard } from '@/shared/guards/auth.guard';
import { RolesGuard } from '@/shared/guards/roles.guard';
import { UserType } from '@/users/domain/enums/user-type.enum';

import { CreateRoomDto } from '../../application/dtos/create-room.dto';
import { CreateRoomUseCase } from '../../application/use-cases/create-room.use-case';

interface AuthenticatedRequest extends Request {
  user?: {
    sub?: unknown;
  };
}

@Controller('salas')
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserType.TUTOR)
export class RoomsController {
  constructor(private readonly createRoomUseCase: CreateRoomUseCase) {}

  @Post()
  create(@Body() dto: CreateRoomDto, @Req() request: AuthenticatedRequest) {
    const tutorId = request.user?.sub;

    if (typeof tutorId !== 'string') {
      throw new UnauthorizedException('Identificação do usuário inválida.');
    }

    return this.createRoomUseCase.execute({
      tutorId,
      name: dto.nome,
      semester: dto.semestre,
    });
  }
}
