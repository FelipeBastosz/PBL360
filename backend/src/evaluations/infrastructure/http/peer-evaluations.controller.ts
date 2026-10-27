import { Body, Controller, Get, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Roles } from '@/shared/decorators/roles.decorator';
import { AuthenticatedUserId } from '@/shared/decorators/authenticated-user-id.decorator';
import { UuidParam } from '@/shared/decorators/uuid-param.decorator';
import { UserType } from '@/users/domain/enums/user-type.enum';
import { SavePeerEvaluationDto } from '../../application/dtos/save-peer-evaluation.dto';
import { SessionPeersResponseDto } from '../../application/dtos/session-peers-response.dto';
import { PeerEvaluationResponseDto } from '../../application/dtos/peer-evaluation-response.dto';
import { ListSessionPeersUseCase } from '../../application/use-cases/list-session-peers.use-case';
import { GetPeerEvaluationUseCase } from '../../application/use-cases/get-peer-evaluation.use-case';
import { SavePeerEvaluationUseCase } from '../../application/use-cases/save-peer-evaluation.use-case';
import {
  toPeerEvaluationResponse,
  toSavePeerEvaluationInput,
  toSessionPeersResponse,
} from './peer-evaluations.mapper';
import {
  GetPeerEvaluationSwaggerDocs,
  ListSessionPeersSwaggerDocs,
  SavePeerEvaluationSwaggerDocs,
} from './peer-evaluations.swagger';

@ApiTags('Avaliações')
@Roles(UserType.STUDENT)
@Controller('sessoes/:sessaoId/pares')
export class PeerEvaluationsController {
  constructor(
    private readonly listSessionPeersUseCase: ListSessionPeersUseCase,
    private readonly getPeerEvaluationUseCase: GetPeerEvaluationUseCase,
    private readonly savePeerEvaluationUseCase: SavePeerEvaluationUseCase,
  ) {}

  @Get()
  @ListSessionPeersSwaggerDocs
  async list(
    @UuidParam('sessaoId') sessionId: string,
    @AuthenticatedUserId() studentId: string,
  ): Promise<SessionPeersResponseDto> {
    const result = await this.listSessionPeersUseCase.execute(sessionId, studentId);
    return toSessionPeersResponse(result);
  }

  @Get(':colegaId')
  @GetPeerEvaluationSwaggerDocs
  async get(
    @UuidParam('sessaoId') sessionId: string,
    @UuidParam('colegaId') peerId: string,
    @AuthenticatedUserId() studentId: string,
  ): Promise<PeerEvaluationResponseDto> {
    const result = await this.getPeerEvaluationUseCase.execute(sessionId, peerId, studentId);
    return toPeerEvaluationResponse(result);
  }

  @Put(':colegaId')
  @SavePeerEvaluationSwaggerDocs
  async put(
    @UuidParam('sessaoId') sessionId: string,
    @UuidParam('colegaId') peerId: string,
    @AuthenticatedUserId() studentId: string,
    @Body() dto: SavePeerEvaluationDto,
  ): Promise<PeerEvaluationResponseDto> {
    const input = toSavePeerEvaluationInput(dto, sessionId, peerId, studentId);
    const result = await this.savePeerEvaluationUseCase.execute(input);
    return toPeerEvaluationResponse(result);
  }
}
