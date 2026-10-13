import { Body, Controller, Delete, HttpCode, HttpStatus, Post, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthenticatedUserId } from '@/shared/decorators/authenticated-user-id.decorator';
import { Roles } from '@/shared/decorators/roles.decorator';
import { UuidParam } from '@/shared/decorators/uuid-param.decorator';
import { UserType } from '@/users/domain/enums/user-type.enum';
import {
  CastPokerVoteDto,
  DecidePokerRoundDto,
  OpenPokerRoundDto,
} from '../../application/dtos/planning-poker-request.dto';
import type {
  PokerDecisionResponseDto,
  PokerRevealResponseDto,
  PokerRoundResponseDto,
  PokerVoteResponseDto,
} from '../../application/dtos/poker-round-response.dto';
import { CancelPokerRoundUseCase } from '../../application/use-cases/cancel-poker-round.use-case';
import { CastPokerVoteUseCase } from '../../application/use-cases/cast-poker-vote.use-case';
import { DecidePokerRoundUseCase } from '../../application/use-cases/decide-poker-round.use-case';
import { OpenPokerRoundUseCase } from '../../application/use-cases/open-poker-round.use-case';
import { RestartPokerVotingUseCase } from '../../application/use-cases/restart-poker-voting.use-case';
import { RevealPokerRoundUseCase } from '../../application/use-cases/reveal-poker-round.use-case';
import { toDecisionAction, toDecisionResponse } from './planning-poker.mapper';
import { toPokerRevealResponse, toPokerRoundResponse } from './poker-round.mapper';
import {
  CancelPokerRoundSwaggerDocs,
  CastPokerVoteSwaggerDocs,
  DecidePokerRoundSwaggerDocs,
  OpenPokerRoundSwaggerDocs,
  RestartPokerVotingSwaggerDocs,
  RevealPokerRoundSwaggerDocs,
} from './poker-rounds.swagger';

@ApiTags('Planning poker')
@Controller('sessoes/:sessaoId/poker/rodadas')
@Roles(UserType.TUTOR)
export class PokerRoundsController {
  constructor(
    private readonly openRound: OpenPokerRoundUseCase,
    private readonly cancelRound: CancelPokerRoundUseCase,
    private readonly castVote: CastPokerVoteUseCase,
    private readonly revealRound: RevealPokerRoundUseCase,
    private readonly restartVoting: RestartPokerVotingUseCase,
    private readonly decideRound: DecidePokerRoundUseCase,
  ) {}

  @Post()
  @OpenPokerRoundSwaggerDocs
  async open(
    @UuidParam('sessaoId') sessionId: string,
    @Body() dto: OpenPokerRoundDto,
    @AuthenticatedUserId() tutorId: string,
  ): Promise<PokerRoundResponseDto> {
    const studentId = dto.alunoId ?? null;
    return toPokerRoundResponse(await this.openRound.execute({ sessionId, tutorId, studentId }));
  }

  @Delete(':rodadaId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @CancelPokerRoundSwaggerDocs
  async cancel(
    @UuidParam('sessaoId') sessionId: string,
    @UuidParam('rodadaId') roundId: string,
    @AuthenticatedUserId() tutorId: string,
  ): Promise<void> {
    await this.cancelRound.execute({ sessionId, tutorId, roundId });
  }

  @Put(':rodadaId/voto')
  @Roles(UserType.STUDENT)
  @CastPokerVoteSwaggerDocs
  async vote(
    @UuidParam('sessaoId') sessionId: string,
    @UuidParam('rodadaId') roundId: string,
    @Body() dto: CastPokerVoteDto,
    @AuthenticatedUserId() studentId: string,
  ): Promise<PokerVoteResponseDto> {
    const input = { sessionId, roundId, studentId, score: dto.nota };
    return { votou: true, nota: await this.castVote.execute(input) };
  }

  @Post(':rodadaId/revelar')
  @HttpCode(HttpStatus.OK)
  @RevealPokerRoundSwaggerDocs
  async reveal(
    @UuidParam('sessaoId') sessionId: string,
    @UuidParam('rodadaId') roundId: string,
    @AuthenticatedUserId() tutorId: string,
  ): Promise<PokerRevealResponseDto> {
    return toPokerRevealResponse(await this.revealRound.execute({ sessionId, tutorId, roundId }));
  }

  @Post(':rodadaId/revotar')
  @HttpCode(HttpStatus.OK)
  @RestartPokerVotingSwaggerDocs
  async revote(
    @UuidParam('sessaoId') sessionId: string,
    @UuidParam('rodadaId') roundId: string,
    @AuthenticatedUserId() tutorId: string,
  ): Promise<PokerRoundResponseDto> {
    const round = await this.restartVoting.execute({ sessionId, tutorId, roundId });
    return toPokerRoundResponse(round);
  }

  @Post(':rodadaId/decisao')
  @HttpCode(HttpStatus.OK)
  @DecidePokerRoundSwaggerDocs
  async decide(
    @UuidParam('sessaoId') sessionId: string,
    @UuidParam('rodadaId') roundId: string,
    @Body() dto: DecidePokerRoundDto,
    @AuthenticatedUserId() tutorId: string,
  ): Promise<PokerDecisionResponseDto> {
    const action = toDecisionAction(dto);
    const decided = await this.decideRound.execute({ sessionId, tutorId, roundId, action });
    return toDecisionResponse(decided);
  }
}
