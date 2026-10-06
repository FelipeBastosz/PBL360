import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Post, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import {
  AuthenticatedUser,
  type AuthenticatedUserRef,
} from '@/shared/decorators/authenticated-user.decorator';
import { AuthenticatedUserId } from '@/shared/decorators/authenticated-user-id.decorator';
import { Roles } from '@/shared/decorators/roles.decorator';
import { UuidParam } from '@/shared/decorators/uuid-param.decorator';
import { UserType } from '@/users/domain/enums/user-type.enum';

import { CreateProblemDto } from '../../application/dtos/create-problem.dto';
import type { ProblemDeletionImpactDto } from '../../application/dtos/problem-deletion-impact.dto';
import { UpdateProblemDto } from '../../application/dtos/update-problem.dto';
import type { ProblemResponseDto } from '../../application/dtos/problem-response.dto';
import { CreateProblemUseCase } from '../../application/use-cases/create-problem.use-case';
import { DeleteProblemUseCase } from '../../application/use-cases/delete-problem.use-case';
import { GetProblemDeletionImpactUseCase } from '../../application/use-cases/get-problem-deletion-impact.use-case';
import { GetProblemUseCase } from '../../application/use-cases/get-problem.use-case';
import { ListProblemsByRoomUseCase } from '../../application/use-cases/list-problems-by-room.use-case';
import { UpdateProblemUseCase } from '../../application/use-cases/update-problem.use-case';
import { ChangeProblemPerformanceTableUseCase } from '../../application/use-cases/change-problem-performance-table.use-case';
import { ChangeProblemPerformanceTableDto } from '../../application/dtos/change-problem-performance-table.dto';
import { ProblemPerformanceTableResponseDto } from '../../application/dtos/problem-performance-table-response.dto';
import type { Problem } from '../../domain/entities/problem.entity';
import {
  toProblemDeletionImpactResponse,
  toProblemPerformanceTableResponse,
  toProblemResponse,
} from './problem.mapper';
import {
  CreateProblemSwaggerDocs,
  DeleteProblemSwaggerDocs,
  GetProblemDeletionImpactSwaggerDocs,
  GetProblemSwaggerDocs,
  ListProblemsSwaggerDocs,
  UpdateProblemSwaggerDocs,
  ChangeProblemPerformanceTableSwaggerDocs,
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
    private readonly getProblemDeletionImpactUseCase: GetProblemDeletionImpactUseCase,
    private readonly deleteProblemUseCase: DeleteProblemUseCase,
    private readonly changeProblemPerformanceTableUseCase: ChangeProblemPerformanceTableUseCase,
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
      performanceTableId: dto.tabelaId ?? null,
    });

    return toProblemResponse(problem);
  }

  @Get()
  @Roles(UserType.TUTOR, UserType.STUDENT)
  @ListProblemsSwaggerDocs
  async list(
    @UuidParam('roomId') roomId: string,
    @AuthenticatedUser() member: AuthenticatedUserRef,
  ): Promise<ProblemResponseDto[]> {
    const problems = await this.listProblemsByRoomUseCase.execute({ roomId, member });

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

  @Get(':problemId/impacto-exclusao')
  @GetProblemDeletionImpactSwaggerDocs
  async getDeletionImpact(
    @UuidParam('roomId') roomId: string,
    @UuidParam('problemId') problemId: string,
    @AuthenticatedUserId() tutorId: string,
  ): Promise<ProblemDeletionImpactDto> {
    const impact = await this.getProblemDeletionImpactUseCase.execute({
      roomId,
      problemId,
      tutorId,
    });
    return toProblemDeletionImpactResponse(impact);
  }

  @Delete(':problemId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @DeleteProblemSwaggerDocs
  async delete(
    @UuidParam('roomId') roomId: string,
    @UuidParam('problemId') problemId: string,
    @AuthenticatedUserId() tutorId: string,
  ): Promise<void> {
    await this.deleteProblemUseCase.execute({ roomId, problemId, tutorId });
  }

  @Put(':problemId/tabela-desempenho')
  @Roles(UserType.TUTOR)
  @HttpCode(HttpStatus.OK)
  @ChangeProblemPerformanceTableSwaggerDocs
  async changePerformanceTable(
    @UuidParam('roomId') roomId: string,
    @UuidParam('problemId') problemId: string,
    @Body() dto: ChangeProblemPerformanceTableDto,
    @AuthenticatedUserId() tutorId: string,
  ): Promise<ProblemPerformanceTableResponseDto> {
    const change = await this.changeProblemPerformanceTableUseCase.execute({
      roomId,
      problemId,
      tutorId,
      performanceTableId: dto.tabelaId,
    });
    return toProblemPerformanceTableResponse(change);
  }
}
