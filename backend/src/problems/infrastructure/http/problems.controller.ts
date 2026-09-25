import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post, Put,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UpdateProblemDto } from '../../application/dtos/update-problem.dto';
import { UpdateProblemUseCase } from '../../application/use-cases/update-problem.use-case';

import { AuthenticatedUserId } from '@/shared/decorators/authenticated-user-id.decorator';
import { Roles } from '@/shared/decorators/roles.decorator';
import { AuthGuard } from '@/shared/guards/auth.guard';
import { RolesGuard } from '@/shared/guards/roles.guard';
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
  UpdateProblemSwaggerDocs,
} from './problem.swagger';

@ApiTags('Problemas')
@Controller('salas/:roomId/problemas')
@UseGuards(AuthGuard, RolesGuard)
export class ProblemsController {
  constructor(
    private readonly createProblemUseCase: CreateProblemUseCase,
    private readonly listProblemsByRoomUseCase: ListProblemsByRoomUseCase,
    private readonly getProblemUseCase: GetProblemUseCase,
    private readonly updateProblemUseCase: UpdateProblemUseCase,
  ) {}


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

  @Get()
  @Roles(UserType.TUTOR)
  @ListProblemsSwaggerDocs
  list(
    @Param('roomId', new ParseUUIDPipe()) roomId: string,
    @AuthenticatedUserId() tutorId: string,
  ): Promise<Problem[]> {
    return this.listProblemsByRoomUseCase.execute({ roomId, tutorId });
  }

  @Get(':problemId')
  @Roles(UserType.TUTOR)
  @GetProblemSwaggerDocs
  getById(
    @Param('roomId', new ParseUUIDPipe()) roomId: string,
    @Param('problemId', new ParseUUIDPipe()) problemId: string,
    @AuthenticatedUserId() tutorId: string,
  ): Promise<Problem> {
    return this.getProblemUseCase.execute({ roomId, problemId, tutorId });
  }

  @Put(':problemId')
  @Roles(UserType.TUTOR)
  @HttpCode(HttpStatus.OK)
  @UpdateProblemSwaggerDocs
async update(
    @Param('roomId', new ParseUUIDPipe()) _roomId: string,
    @Param('problemId', new ParseUUIDPipe()) problemId: string,
    @Body() dto: UpdateProblemDto,
    @AuthenticatedUserId() _tutorId: string,
  ): Promise<Problem> {
    return this.updateProblemUseCase.execute(problemId, dto);
  }
}
