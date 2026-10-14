import { Inject, Injectable } from '@nestjs/common';
import { ConflictError, ForbiddenError, NotFoundError } from '@/shared/errors/application.error';
import { UserType } from '@/users/domain/enums/user-type.enum';
import type { PokerRound } from '../../domain/entities/poker-round';
import {
  POKER_ROUND_REPOSITORY,
  type PokerRoundRepository,
} from '../../domain/repositories/poker-round.repository';
import { POKER_EVENT_PUBLISHER, type PokerEventPublisher } from '../services/poker-event-publisher';
import { PokerContextService } from '../services/poker-context.service';

export interface CastPokerVoteInput {
  sessionId: string;
  roundId: string;
  studentId: string;
  score: number;
}

@Injectable()
export class CastPokerVoteUseCase {
  constructor(
    private readonly context: PokerContextService,
    @Inject(POKER_ROUND_REPOSITORY) private readonly rounds: PokerRoundRepository,
    @Inject(POKER_EVENT_PUBLISHER) private readonly events: PokerEventPublisher,
  ) {}

  async execute(input: CastPokerVoteInput): Promise<number> {
    const member = { id: input.studentId, type: UserType.STUDENT };
    const poker = await this.context.forMember(input.sessionId, member);
    const round = await this.rounds.findById(poker.id, input.roundId);
    if (!round) throw new NotFoundError('Rodada não encontrada.');
    this.assertCanVote(round, input.studentId);
    const vote = { voterId: input.studentId, score: input.score };
    if (!(await this.rounds.castVote(round.id, vote))) {
      throw new ConflictError('Os votos desta rodada já foram revelados.');
    }
    await this.announce(poker.sessionId, round);
    return input.score;
  }

  private assertCanVote(round: PokerRound, studentId: string): void {
    if (round.studentId === studentId) {
      throw new ForbiddenError('Você não vota na própria rodada.');
    }
    if (!round.isVoter(studentId)) throw new ForbiddenError('Você não participou desta sessão.');
  }

  private async announce(sessionId: string, round: PokerRound): Promise<void> {
    const voters = new Set((await this.rounds.findVotes(round.id)).map((vote) => vote.voterId));
    const votedSeats = round.seats
      .filter((seat) => voters.has(seat.studentId))
      .map((seat) => seat.seat);
    this.events.publish(sessionId, {
      type: 'VOTE_CAST',
      roundId: round.id,
      votedSeats,
      expected: round.voterIds.length,
    });
  }
}
