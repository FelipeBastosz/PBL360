import { Inject, Injectable } from '@nestjs/common';
import { ConflictError, UnprocessableEntityError } from '@/shared/errors/application.error';
import type { PokerDecision, PokerRound } from '../../domain/entities/poker-round';
import {
  POKER_ROUND_REPOSITORY,
  type PokerRoundRepository,
} from '../../domain/repositories/poker-round.repository';
import { POKER_EVENT_PUBLISHER, type PokerEventPublisher } from '../services/poker-event-publisher';
import { PokerContextService } from '../services/poker-context.service';
import type { PokerRoundInput } from './cancel-poker-round.use-case';

export type PokerDecisionAction =
  { type: 'ACCEPT' } | { type: 'ADJUST'; grade: number; justification: string };

export interface DecidePokerRoundInput extends PokerRoundInput {
  action: PokerDecisionAction;
}

export interface DecidedPokerRound {
  studentId: string;
  average: number | null;
  decision: PokerDecision;
}

@Injectable()
export class DecidePokerRoundUseCase {
  constructor(
    private readonly context: PokerContextService,
    @Inject(POKER_ROUND_REPOSITORY) private readonly rounds: PokerRoundRepository,
    @Inject(POKER_EVENT_PUBLISHER) private readonly events: PokerEventPublisher,
  ) {}

  async execute(input: DecidePokerRoundInput): Promise<DecidedPokerRound> {
    const { poker, round } = await this.context.roundForTutor(input);
    if (!round.isRevealed)
      throw new ConflictError('A rodada não está revelada ou já foi decidida.');
    const decision = this.toDecision(round, input.action, input.tutorId);
    if (!(await this.rounds.decide(round.id, decision))) {
      throw new ConflictError('A rodada não está revelada ou já foi decidida.');
    }
    const { finalGrade, adjusted } = decision;
    this.events.publish(poker.sessionId, {
      type: 'DECIDED',
      roundId: round.id,
      finalGrade,
      adjusted,
    });
    return { studentId: round.studentId, average: round.average, decision };
  }

  private toDecision(round: PokerRound, action: PokerDecisionAction, tutorId: string) {
    const base = { decidedBy: tutorId, decidedAt: new Date() };
    if (action.type === 'ADJUST') {
      return {
        ...base,
        finalGrade: action.grade,
        adjusted: true,
        justification: action.justification,
      };
    }
    if (round.average === null) {
      throw new UnprocessableEntityError('Rodada sem votos não pode ser aceita, só reajustada.');
    }
    return { ...base, finalGrade: round.average, adjusted: false, justification: null };
  }
}
