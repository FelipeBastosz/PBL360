import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { AuthenticatedUserId } from '@/shared/decorators/authenticated-user-id.decorator';
import { Roles } from '@/shared/decorators/roles.decorator';
import { AuthGuard } from '@/shared/guards/auth.guard';
import { RolesGuard } from '@/shared/guards/roles.guard';
import { UserType } from '@/users/domain/enums/user-type.enum';

import { CreateProblemDto } from '../../application/dtos/create-problem.dto';
import { CreateProblemUseCase } from '../../application/use-cases/create-problem.use-case';
import type { Problem } from '../../domain/entities/problem.entity';
import { CreateProblemSwaggerDocs } from './problem.swagger';

@ApiTags('Problemas')
@Controller('salas/:roomId/problemas')
@UseGuards(AuthGuard, RolesGuard)
export class ProblemsController {
  constructor(private readonly createProblemUseCase: CreateProblemUseCase) {}

  @Post()
  @Roles(UserType.TUTOR)
  @CreateProblemSwaggerDocs
  @HttpCode(HttpStatus.CREATED)
  create(
    @Param('roomId', new ParseUUIDPipe()) roomId: string,
    @Body() dto: CreateProblemDto,
    @AuthenticatedUserId() authorId: string,
  ): Promise<Problem> {
    return this.createProblemUseCase.execute({
      roomId,
      authorId,
      title: dto.titulo,
      description: dto.descricao,
      startDate: dto.dataInicio ? new Date(dto.dataInicio) : null,
      endDate: dto.dataFim ? new Date(dto.dataFim) : null,
    });
  }
}
