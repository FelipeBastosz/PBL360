import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { UuidParam } from '@/shared/decorators/uuid-param.decorator';
import { AuthenticatedUserId } from '@/shared/decorators/authenticated-user-id.decorator';
import { Roles } from '@/shared/decorators/roles.decorator';
import { UserType } from '@/users/domain/enums/user-type.enum';

import { CreateProblemDto } from '../../application/dtos/create-problem.dto';
import { CreateProblemUseCase } from '../../application/use-cases/create-problem.use-case';
import { GetProblemUseCase } from '../../application/use-cases/get-problem.use-case';
import { ListProblemsByRoomUseCase } from '../../application/use-cases/list-problems-by-room.use-case';
import type { Problem } from '../../domain/entities/problem.entity';
import {
  CreateProblemSwaggerDocs,
  GetProblemSwaggerDocs,
  ListProblemsSwaggerDocs,
} from './problem.swagger';

@ApiTags('Problemas')
@Controller('salas/:roomId/problemas')
export class ProblemsController {
  constructor(
    private readonly createProblemUseCase: CreateProblemUseCase,
    private readonly listProblemsByRoomUseCase: ListProblemsByRoomUseCase,
    private readonly getProblemUseCase: GetProblemUseCase,
  ) {}

  @Post()
  @Roles(UserType.TUTOR)
  @CreateProblemSwaggerDocs
  @HttpCode(HttpStatus.CREATED)
  create(
    @UuidParam('roomId') roomId: string,
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

  @Get()
  @Roles(UserType.TUTOR)
  @ListProblemsSwaggerDocs
  list(
    @UuidParam('roomId') roomId: string,
    @AuthenticatedUserId() tutorId: string,
  ): Promise<Problem[]> {
    return this.listProblemsByRoomUseCase.execute({ roomId, tutorId });
  }

  @Get(':problemId')
  @Roles(UserType.TUTOR)
  @GetProblemSwaggerDocs
  getById(
    @UuidParam('roomId') roomId: string,
    @UuidParam('problemId') problemId: string,
    @AuthenticatedUserId() tutorId: string,
  ): Promise<Problem> {
    return this.getProblemUseCase.execute({ roomId, problemId, tutorId });
  }
}
