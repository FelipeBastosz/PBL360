import { Inject, Injectable } from '@nestjs/common';
import type { RoomMember } from '@/rooms/application/services/room-access.service';
import { SessionAccessService } from '@/sessions/application/services/session-access.service';
import { NotFoundError } from '@/shared/errors/application.error';
import type { PlanningPoker } from '../../domain/entities/planning-poker';
import type { PokerRound } from '../../domain/entities/poker-round';
import {
  PLANNING_POKER_REPOSITORY,
  type PlanningPokerRepository,
} from '../../domain/repositories/planning-poker.repository';
import {
  POKER_ROUND_REPOSITORY,
  type PokerRoundRepository,
} from '../../domain/repositories/poker-round.repository';

export interface TutorRoundRef {
  sessionId: string;
  tutorId: string;
  roundId: string;
}

export interface TutorRoundContext {
  poker: PlanningPoker;
  round: PokerRound;
}

@Injectable()
export class PokerContextService {
  constructor(
    private readonly access: SessionAccessService,
    @Inject(PLANNING_POKER_REPOSITORY) private readonly pokers: PlanningPokerRepository,
    @Inject(POKER_ROUND_REPOSITORY) private readonly rounds: PokerRoundRepository,
  ) {}

  async forTutor(sessionId: string, tutorId: string): Promise<PlanningPoker> {
    await this.access.assertTutorCanAccessSessionById(sessionId, tutorId);
    return this.requireOpen(sessionId);
  }

  async forMember(sessionId: string, member: RoomMember): Promise<PlanningPoker> {
    await this.access.assertMemberCanAccessSession(sessionId, member);
    return this.requireOpen(sessionId);
  }

  async roundForTutor({ sessionId, tutorId, roundId }: TutorRoundRef): Promise<TutorRoundContext> {
    const poker = await this.forTutor(sessionId, tutorId);
    const round = await this.rounds.findById(poker.id, roundId);
    if (!round) throw new NotFoundError('Rodada não encontrada.');
    return { poker, round };
  }

  private async requireOpen(sessionId: string): Promise<PlanningPoker> {
    const poker = await this.pokers.findOpenBySession(sessionId);
    if (!poker) throw new NotFoundError('Nenhum planning poker aberto nesta sessão.');
    return poker;
  }
}
