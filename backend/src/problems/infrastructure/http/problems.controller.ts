import { Body, Controller, Get, HttpCode, HttpStatus, Post, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { AuthenticatedUserId } from '@/shared/decorators/authenticated-user-id.decorator';
import { Roles } from '@/shared/decorators/roles.decorator';
import { UuidParam } from '@/shared/decorators/uuid-param.decorator';
import { UserType } from '@/users/domain/enums/user-type.enum';

import { CreateProblemDto } from '../../application/dtos/create-problem.dto';
import { UpdateProblemDto } from '../../application/dtos/update-problem.dto';
import type { ProblemResponseDto } from '../../application/dtos/problem-response.dto';
import { CreateProblemUseCase } from '../../application/use-cases/create-problem.use-case';
import { GetProblemUseCase } from '../../application/use-cases/get-problem.use-case';
import { ListProblemsByRoomUseCase } from '../../application/use-cases/list-problems-by-room.use-case';
import { UpdateProblemUseCase } from '../../application/use-cases/update-problem.use-case';
import type { Problem } from '../../domain/entities/problem.entity';
import { toProblemResponse } from './problem.mapper';
import {
  CreateProblemSwaggerDocs,
  GetProblemSwaggerDocs,
  ListProblemsSwaggerDocs,
  UpdateProblemSwaggerDocs,
} from './problem.swagger';

@ApiTags('Problemas')
@Controller('salas/:roomId/problemas')
@Roles(UserType.TUTOR)
export class ProblemsController {
  constructor(
    private readonly createProblemUseCase: CreateProblemUseCase,
    private readonly listProblemsByRoomUseCase: ListProblemsByRoomUseCase,
    private readonly getProblemUseCase: GetProblemUseCase,
    private readonly updateProblemUseCase: UpdateProblemUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @CreateProblemSwaggerDocs
  async create(
    @UuidParam('roomId') roomId: string,
    @Body() dto: CreateProblemDto,
    @AuthenticatedUserId() authorId: string,
  ): Promise<ProblemResponseDto> {
    const problem = await this.createProblemUseCase.execute({
      roomId,
      authorId,
      title: dto.titulo,
      description: dto.descricao,
      startDate: dto.dataInicio ?? null,
      endDate: dto.dataFim ?? null,
    });

    return toProblemResponse(problem);
  }

  @Get()
  @ListProblemsSwaggerDocs
  async list(
    @UuidParam('roomId') roomId: string,
    @AuthenticatedUserId() tutorId: string,
  ): Promise<ProblemResponseDto[]> {
    const problems = await this.listProblemsByRoomUseCase.execute({ roomId, tutorId });

    return problems.map(toProblemResponse);
  }

  @Get(':problemId')
  @GetProblemSwaggerDocs
  async getById(
    @UuidParam('roomId') roomId: string,
    @UuidParam('problemId') problemId: string,
    @AuthenticatedUserId() tutorId: string,
  ): Promise<ProblemResponseDto> {
    return toProblemResponse(await this.getProblemUseCase.execute({ roomId, problemId, tutorId }));
  }

  @Put(':problemId')
  @Roles(UserType.TUTOR)
  @HttpCode(HttpStatus.OK)
  @UpdateProblemSwaggerDocs
  async update(
    @UuidParam('roomId') roomId: string,
    @UuidParam('problemId') problemId: string,
    @Body() dto: UpdateProblemDto,
    @AuthenticatedUserId() tutorId: string,
  ): Promise<Problem> {
    return this.updateProblemUseCase.execute({ roomId, problemId, tutorId, dto });
  }
}
