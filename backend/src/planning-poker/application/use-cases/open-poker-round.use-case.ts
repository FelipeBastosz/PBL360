import { Inject, Injectable } from '@nestjs/common';
import {
  ConflictError,
  InvalidRequestError,
  UnprocessableEntityError,
} from '@/shared/errors/application.error';
import { PokerOrder, type PlanningPoker } from '../../domain/entities/planning-poker';
import {
  PLANNING_POKER_REPOSITORY,
  type PlanningPokerRepository,
} from '../../domain/repositories/planning-poker.repository';
import {
  POKER_ROUND_REPOSITORY,
  type PokerRoundRepository,
} from '../../domain/repositories/poker-round.repository';
import { drawSeats } from '../../domain/services/seat-draw';
import { POKER_EVENT_PUBLISHER, type PokerEventPublisher } from '../services/poker-event-publisher';
import { PokerContextService } from '../services/poker-context.service';
import { PokerStateService } from '../services/poker-state.service';
import type { RoundView } from '../services/poker-views';

export interface OpenPokerRoundInput {
  sessionId: string;
  tutorId: string;
  studentId: string | null;
}

@Injectable()
export class OpenPokerRoundUseCase {
  constructor(
    private readonly context: PokerContextService,
    private readonly state: PokerStateService,
    @Inject(PLANNING_POKER_REPOSITORY) private readonly pokers: PlanningPokerRepository,
    @Inject(POKER_ROUND_REPOSITORY) private readonly rounds: PokerRoundRepository,
    @Inject(POKER_EVENT_PUBLISHER) private readonly events: PokerEventPublisher,
  ) {}

  async execute(input: OpenPokerRoundInput): Promise<RoundView> {
    const poker = await this.context.forTutor(input.sessionId, input.tutorId);
    if (await this.rounds.findOpen(poker.id)) {
      throw new ConflictError('Há uma rodada aberta ainda não decidida.');
    }
    const studentId = this.pickStudent(poker, input.studentId);
    const round = await this.rounds.open(
      { pokerId: poker.id, studentId, ...(await this.nextRound(poker)) },
      poker.without(studentId),
    );
    const view = await this.state.roundView(poker, round);
    this.events.publish(poker.sessionId, { type: 'ROUND_OPENED', round: view });
    return view;
  }

  private pickStudent(poker: PlanningPoker, chosen: string | null): string {
    if (poker.order === PokerOrder.MANUAL && chosen === null) {
      throw new InvalidRequestError('Escolha o aluno que será avaliado nesta rodada.');
    }
    const studentId = poker.pickNext(chosen);
    if (!studentId) {
      throw new UnprocessableEntityError('O aluno não participou da sessão ou já foi avaliado.');
    }
    return studentId;
  }

  private async nextRound(poker: PlanningPoker) {
    const [roster, decided, last] = await Promise.all([
      this.pokers.findRoster(poker.sessionId),
      this.rounds.findDecided(poker.id),
      this.rounds.findLast(poker.id),
    ]);
    const ordered = roster.participants.map((participant) => participant.studentId);
    const seats = drawSeats(ordered, poker.anonymous, last?.seats ?? null);
    return { number: decided.length + 1, seats };
  }
}
