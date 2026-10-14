import { Inject, Injectable } from '@nestjs/common';
import { ConflictError } from '@/shared/errors/application.error';
import { PokerRoundStatus, PokerRound } from '../../domain/entities/poker-round';
import {
  POKER_ROUND_REPOSITORY,
  type PokerRoundRepository,
} from '../../domain/repositories/poker-round.repository';
import { pokerAverage } from '../../domain/services/poker-average';
import { POKER_EVENT_PUBLISHER, type PokerEventPublisher } from '../services/poker-event-publisher';
import { PokerContextService } from '../services/poker-context.service';
import { PokerStateService } from '../services/poker-state.service';
import type { RoundReveal } from '../services/poker-views';
import type { PokerRoundInput } from './cancel-poker-round.use-case';

@Injectable()
export class RevealPokerRoundUseCase {
  constructor(
    private readonly context: PokerContextService,
    private readonly state: PokerStateService,
    @Inject(POKER_ROUND_REPOSITORY) private readonly rounds: PokerRoundRepository,
    @Inject(POKER_EVENT_PUBLISHER) private readonly events: PokerEventPublisher,
  ) {}

  async execute(input: PokerRoundInput): Promise<RoundReveal> {
    const { poker, round } = await this.context.roundForTutor(input);
    const votes = await this.rounds.findVotes(round.id);
    const average = pokerAverage(votes.map((vote) => vote.score));
    if (!(await this.rounds.reveal(round.id, average))) {
      throw new ConflictError('Os votos desta rodada já foram revelados.');
    }
    const revealed = new PokerRound({ ...round, status: PokerRoundStatus.REVEALED, average });
    const view = await this.state.roundView(poker, revealed);
    const reveal = view.reveal!;
    this.events.publish(poker.sessionId, { type: 'REVEALED', roundId: round.id, reveal });
    return reveal;
  }
}
