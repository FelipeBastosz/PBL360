import { Inject, Injectable } from '@nestjs/common';
import { ConflictError } from '@/shared/errors/application.error';
import {
  POKER_ROUND_REPOSITORY,
  type PokerRoundRepository,
} from '../../domain/repositories/poker-round.repository';
import { POKER_EVENT_PUBLISHER, type PokerEventPublisher } from '../services/poker-event-publisher';
import { PokerContextService } from '../services/poker-context.service';

export interface PokerRoundInput {
  sessionId: string;
  tutorId: string;
  roundId: string;
}

@Injectable()
export class CancelPokerRoundUseCase {
  constructor(
    private readonly context: PokerContextService,
    @Inject(POKER_ROUND_REPOSITORY) private readonly rounds: PokerRoundRepository,
    @Inject(POKER_EVENT_PUBLISHER) private readonly events: PokerEventPublisher,
  ) {}

  async execute(input: PokerRoundInput): Promise<void> {
    const { poker, round } = await this.context.roundForTutor(input);
    const cancelled = await this.rounds.cancel(round, poker.withFirst(round.studentId));
    if (!cancelled) throw new ConflictError('A rodada já foi decidida.');
    this.events.publish(poker.sessionId, { type: 'ROUND_CANCELLED', roundId: round.id });
  }
}
