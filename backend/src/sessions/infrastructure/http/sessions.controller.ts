import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Post, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthenticatedUserId } from '@/shared/decorators/authenticated-user-id.decorator';
import { Roles } from '@/shared/decorators/roles.decorator';
import { UuidParam } from '@/shared/decorators/uuid-param.decorator';
import { UserType } from '@/users/domain/enums/user-type.enum';
import { CreateSessionDto } from '../../application/dtos/create-session.dto';
import { UpdateSessionDto } from '../../application/dtos/update-session.dto';
import { CreateSessionUseCase } from '../../application/use-cases/create-session.use-case';
import { DeleteSessionUseCase } from '../../application/use-cases/delete-session.use-case';
import { GetSessionDeletionImpactUseCase } from '../../application/use-cases/get-session-deletion-impact.use-case';
import { GetSessionUseCase } from '../../application/use-cases/get-session.use-case';
import { ListSessionsUseCase } from '../../application/use-cases/list-sessions.use-case';
import { UpdateSessionUseCase } from '../../application/use-cases/update-session.use-case';
import type { SessionDeletionImpactDto } from '../../application/dtos/session-deletion-impact.dto';
import {
  toSessionCreatedResponse,
  toSessionDeletionImpactResponse,
  toSessionDetailResponse,
  toSessionResponse,
  toUpdateSessionInput,
} from './session.mapper';
import {
  CreateSessionSwaggerDocs,
  DeleteSessionSwaggerDocs,
  GetSessionDeletionImpactSwaggerDocs,
  GetSessionSwaggerDocs,
  ListSessionsSwaggerDocs,
  UpdateSessionSwaggerDocs,
} from './session.swagger';

@ApiTags('Sessões')
@Controller('salas/:roomId/problemas/:problemId/sessoes')
@Roles(UserType.TUTOR)
export class SessionsController {
  constructor(
    private readonly createSession: CreateSessionUseCase,
    private readonly listSessions: ListSessionsUseCase,
    private readonly getSession: GetSessionUseCase,
    private readonly updateSession: UpdateSessionUseCase,
    private readonly getDeletionImpact: GetSessionDeletionImpactUseCase,
    private readonly deleteSession: DeleteSessionUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @CreateSessionSwaggerDocs
  async create(
    @UuidParam('roomId') roomId: string,
    @UuidParam('problemId') problemId: string,
    @Body() dto: CreateSessionDto,
    @AuthenticatedUserId() tutorId: string,
  ) {
    const session = await this.createSession.execute({
      roomId,
      problemId,
      tutorId,
      title: dto.titulo,
      description: dto.descricao,
      date: dto.data,
    });
    return toSessionCreatedResponse(session, problemId);
  }

  @Get()
  @ListSessionsSwaggerDocs
  async list(
    @UuidParam('roomId') roomId: string,
    @UuidParam('problemId') problemId: string,
    @AuthenticatedUserId() tutorId: string,
  ) {
    const sessions = await this.listSessions.execute({ roomId, problemId, tutorId });
    return sessions.map(toSessionResponse);
  }

  @Get(':sessionId')
  @GetSessionSwaggerDocs
  async getById(
    @UuidParam('roomId') roomId: string,
    @UuidParam('problemId') problemId: string,
    @UuidParam('sessionId') sessionId: string,
    @AuthenticatedUserId() tutorId: string,
  ) {
    const session = await this.getSession.execute({ roomId, problemId, sessionId, tutorId });
    return toSessionDetailResponse(session, problemId, roomId);
  }

  @Put(':sessionId')
  @HttpCode(HttpStatus.OK)
  @UpdateSessionSwaggerDocs
  async update(
    @UuidParam('roomId') roomId: string,
    @UuidParam('problemId') problemId: string,
    @UuidParam('sessionId') sessionId: string,
    @Body() dto: UpdateSessionDto,
    @AuthenticatedUserId() tutorId: string,
  ) {
    const session = await this.updateSession.execute(
      toUpdateSessionInput(roomId, problemId, sessionId, tutorId, dto),
    );
    return toSessionDetailResponse(session, problemId, roomId);
  }

  @Get(':sessionId/impacto-exclusao')
  @GetSessionDeletionImpactSwaggerDocs
  async getImpact(
    @UuidParam('roomId') roomId: string,
    @UuidParam('problemId') problemId: string,
    @UuidParam('sessionId') sessionId: string,
    @AuthenticatedUserId() tutorId: string,
  ): Promise<SessionDeletionImpactDto> {
    const impact = await this.getDeletionImpact.execute({ roomId, problemId, sessionId, tutorId });
    return toSessionDeletionImpactResponse(impact);
  }

  @Delete(':sessionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @DeleteSessionSwaggerDocs
  delete(
    @UuidParam('roomId') roomId: string,
    @UuidParam('problemId') problemId: string,
    @UuidParam('sessionId') sessionId: string,
    @AuthenticatedUserId() tutorId: string,
  ): Promise<void> {
    return this.deleteSession.execute({ roomId, problemId, sessionId, tutorId });
  }
}
