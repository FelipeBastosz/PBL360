import { Inject, Injectable } from '@nestjs/common';
import { ConflictError } from '@/shared/errors/application.error';
import { PokerRound, PokerRoundStatus } from '../../domain/entities/poker-round';
import {
  POKER_ROUND_REPOSITORY,
  type PokerRoundRepository,
} from '../../domain/repositories/poker-round.repository';
import { drawSeats } from '../../domain/services/seat-draw';
import { POKER_EVENT_PUBLISHER, type PokerEventPublisher } from '../services/poker-event-publisher';
import { PokerContextService } from '../services/poker-context.service';
import { PokerStateService } from '../services/poker-state.service';
import type { RoundView } from '../services/poker-views';
import type { PokerRoundInput } from './cancel-poker-round.use-case';

@Injectable()
export class RestartPokerVotingUseCase {
  constructor(
    private readonly context: PokerContextService,
    private readonly state: PokerStateService,
    @Inject(POKER_ROUND_REPOSITORY) private readonly rounds: PokerRoundRepository,
    @Inject(POKER_EVENT_PUBLISHER) private readonly events: PokerEventPublisher,
  ) {}

  async execute(input: PokerRoundInput): Promise<RoundView> {
    const { poker, round } = await this.context.roundForTutor(input);
    const seats = drawSeats(
      round.seats.map((seat) => seat.studentId),
      poker.anonymous,
      round.seats,
    );
    if (!(await this.rounds.restart(round.id, seats))) {
      throw new ConflictError(
        'Só é possível votar novamente depois de revelar e antes de decidir.',
      );
    }
    const restarted = { ...round, seats, status: PokerRoundStatus.VOTING, average: null };
    const view = await this.state.roundView(poker, new PokerRound(restarted));
    this.events.publish(poker.sessionId, { type: 'ROUND_OPENED', round: view });
    return view;
  }
}
