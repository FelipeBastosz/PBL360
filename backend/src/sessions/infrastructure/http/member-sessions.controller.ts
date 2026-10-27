import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  AuthenticatedUser,
  type AuthenticatedUserRef,
} from '@/shared/decorators/authenticated-user.decorator';
import { Roles } from '@/shared/decorators/roles.decorator';
import { UuidParam } from '@/shared/decorators/uuid-param.decorator';
import { UserType } from '@/users/domain/enums/user-type.enum';
import type {
  MemberSessionResponseDto,
  RoomSessionResponseDto,
} from '../../application/dtos/member-session.dto';
import { GetMemberSessionUseCase } from '../../application/use-cases/get-member-session.use-case';
import { ListRoomSessionsUseCase } from '../../application/use-cases/list-room-sessions.use-case';
import { toSessionResponse } from './session.mapper';
import {
  GetMemberSessionSwaggerDocs,
  ListRoomSessionsSwaggerDocs,
} from './member-sessions.swagger';

@ApiTags('Sessões da sala')
@Controller()
@Roles(UserType.TUTOR, UserType.STUDENT)
export class MemberSessionsController {
  constructor(
    private readonly listRoomSessions: ListRoomSessionsUseCase,
    private readonly getMemberSession: GetMemberSessionUseCase,
  ) {}

  @Get('salas/:salaId/sessoes')
  @ListRoomSessionsSwaggerDocs
  async list(
    @UuidParam('salaId') roomId: string,
    @AuthenticatedUser() member: AuthenticatedUserRef,
  ): Promise<RoomSessionResponseDto[]> {
    const sessions = await this.listRoomSessions.execute({ roomId, member });
    return sessions.map((session) => ({
      id: session.id,
      titulo: session.title,
      data: session.date,
      ordem: session.orderIndex,
      status: session.status,
      problemaId: session.problemId,
      problemaTitulo: session.problemTitle,
    }));
  }

  @Get('sessoes/:sessaoId')
  @GetMemberSessionSwaggerDocs
  async get(
    @UuidParam('sessaoId') sessionId: string,
    @AuthenticatedUser() member: AuthenticatedUserRef,
  ): Promise<MemberSessionResponseDto> {
    const { session, problem, roomId } = await this.getMemberSession.execute({ sessionId, member });
    return {
      ...toSessionResponse(session),
      problemaId: problem.id,
      salaId: roomId,
      problemaTitulo: problem.title,
    };
  }
}
