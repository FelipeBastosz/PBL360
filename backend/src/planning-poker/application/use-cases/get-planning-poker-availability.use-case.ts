import { Inject, Injectable } from '@nestjs/common';
import { SessionAccessService } from '@/sessions/application/services/session-access.service';
import {
  SESSION_REPOSITORY,
  type SessionRepository,
} from '@/sessions/domain/repositories/session.repository';
import {
  PLANNING_POKER_REPOSITORY,
  type PlanningPokerRepository,
} from '../../domain/repositories/planning-poker.repository';
import { pokerBlockReason, type PokerBlockReason } from '../services/poker-start-policy';

export interface PlanningPokerAvailability {
  blockReason: PokerBlockReason | null;
  presentStudents: number;
  openPokerId: string | null;
}

@Injectable()
export class GetPlanningPokerAvailabilityUseCase {
  constructor(
    private readonly access: SessionAccessService,
    @Inject(SESSION_REPOSITORY) private readonly sessions: SessionRepository,
    @Inject(PLANNING_POKER_REPOSITORY) private readonly pokers: PlanningPokerRepository,
  ) {}

  async execute(sessionId: string, tutorId: string): Promise<PlanningPokerAvailability> {
    const { session } = await this.access.assertTutorCanAccessSessionById(sessionId, tutorId);
    const [submissions, open] = await Promise.all([
      this.sessions.countReleaseSubmissions(session.id),
      this.pokers.findOpenBySession(session.id),
    ]);
    return {
      blockReason: open ? null : pokerBlockReason(session, submissions),
      presentStudents: submissions.presentStudents,
      openPokerId: open?.id ?? null,
    };
  }
}
