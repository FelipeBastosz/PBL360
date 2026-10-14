import { Inject, Injectable } from '@nestjs/common';
import { ConflictError, UnprocessableEntityError } from '@/shared/errors/application.error';
import { PokerOrder } from '../../domain/entities/planning-poker';
import {
  PLANNING_POKER_REPOSITORY,
  type PlanningPokerRepository,
} from '../../domain/repositories/planning-poker.repository';
import { POKER_EVENT_PUBLISHER, type PokerEventPublisher } from '../services/poker-event-publisher';
import { PokerContextService } from '../services/poker-context.service';

export interface ReorderPokerQueueInput {
  sessionId: string;
  tutorId: string;
  queue: string[];
}

@Injectable()
export class ReorderPokerQueueUseCase {
  constructor(
    private readonly context: PokerContextService,
    @Inject(PLANNING_POKER_REPOSITORY) private readonly pokers: PlanningPokerRepository,
    @Inject(POKER_EVENT_PUBLISHER) private readonly events: PokerEventPublisher,
  ) {}

  async execute(input: ReorderPokerQueueInput): Promise<string[]> {
    const poker = await this.context.forTutor(input.sessionId, input.tutorId);
    if (poker.order !== PokerOrder.SEQUENTIAL) {
      throw new ConflictError('A fila só pode ser editada no modo sequencial.');
    }
    if (!poker.isSameQueue(input.queue)) {
      throw new UnprocessableEntityError(
        'A fila deve conter exatamente os alunos que ainda faltam avaliar.',
      );
    }
    await this.pokers.updateQueue(poker.id, input.queue);
    this.events.publish(poker.sessionId, { type: 'QUEUE_UPDATED', queue: input.queue });
    return input.queue;
  }
}
