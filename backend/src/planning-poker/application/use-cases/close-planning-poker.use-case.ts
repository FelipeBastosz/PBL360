import { Inject, Injectable } from '@nestjs/common';
import { ConflictError } from '@/shared/errors/application.error';
import {
  PLANNING_POKER_REPOSITORY,
  type PlanningPokerRepository,
} from '../../domain/repositories/planning-poker.repository';
import {
  POKER_ROUND_REPOSITORY,
  type PokerRoundRepository,
} from '../../domain/repositories/poker-round.repository';
import { POKER_EVENT_PUBLISHER, type PokerEventPublisher } from '../services/poker-event-publisher';
import { PokerContextService } from '../services/poker-context.service';
import { PokerStateService } from '../services/poker-state.service';
import { buildCompleted, type CompletedRound, type PokerStudent } from '../services/poker-views';

export interface ClosedPlanningPoker {
  evaluated: number;
  notEvaluated: PokerStudent[];
  results: CompletedRound[];
}

@Injectable()
export class ClosePlanningPokerUseCase {
  constructor(
    private readonly context: PokerContextService,
    private readonly state: PokerStateService,
    @Inject(PLANNING_POKER_REPOSITORY) private readonly pokers: PlanningPokerRepository,
    @Inject(POKER_ROUND_REPOSITORY) private readonly rounds: PokerRoundRepository,
    @Inject(POKER_EVENT_PUBLISHER) private readonly events: PokerEventPublisher,
  ) {}

  async execute(sessionId: string, tutorId: string): Promise<ClosedPlanningPoker> {
    const poker = await this.context.forTutor(sessionId, tutorId);
    const [students, decided, open] = await Promise.all([
      this.state.students(sessionId),
      this.rounds.findDecided(poker.id),
      this.rounds.findOpen(poker.id),
    ]);
    if (!(await this.pokers.close(poker.id, tutorId))) {
      throw new ConflictError('O planning poker já foi encerrado.');
    }
    this.events.publish(sessionId, { type: 'CLOSED', pokerId: poker.id });
    const pending = open ? [open.studentId, ...poker.queue] : poker.queue;
    const results = buildCompleted(decided, students);
    const notEvaluated = pending.flatMap((id) => students.get(id) ?? []);
    return { evaluated: results.length, notEvaluated, results };
  }
}
