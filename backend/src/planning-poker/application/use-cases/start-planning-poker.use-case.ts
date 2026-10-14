import { Inject, Injectable } from '@nestjs/common';
import { SessionAccessService } from '@/sessions/application/services/session-access.service';
import type { Session } from '@/sessions/domain/entities/session.entity';
import {
  SESSION_REPOSITORY,
  type SessionRepository,
} from '@/sessions/domain/repositories/session.repository';
import { ConflictError } from '@/shared/errors/application.error';
import type { PokerOrder } from '../../domain/entities/planning-poker';
import {
  PLANNING_POKER_REPOSITORY,
  type PlanningPokerRepository,
} from '../../domain/repositories/planning-poker.repository';
import { POKER_BLOCK_MESSAGES, pokerBlockReason } from '../services/poker-start-policy';
import { PokerStateService } from '../services/poker-state.service';
import type { TutorPokerState } from '../services/poker-views';

export interface StartPlanningPokerInput {
  sessionId: string;
  tutorId: string;
  anonymous: boolean;
  order: PokerOrder;
}

@Injectable()
export class StartPlanningPokerUseCase {
  constructor(
    private readonly access: SessionAccessService,
    @Inject(SESSION_REPOSITORY) private readonly sessions: SessionRepository,
    @Inject(PLANNING_POKER_REPOSITORY) private readonly pokers: PlanningPokerRepository,
    private readonly state: PokerStateService,
  ) {}

  async execute(input: StartPlanningPokerInput): Promise<TutorPokerState> {
    const { session } = await this.access.assertTutorCanAccessSessionById(
      input.sessionId,
      input.tutorId,
    );
    await this.assertCanStart(session);
    const roster = await this.pokers.findRoster(session.id);
    const poker = await this.pokers.create({
      sessionId: session.id,
      anonymous: input.anonymous,
      order: input.order,
      queue: roster.participants.map((participant) => participant.studentId),
      createdBy: input.tutorId,
    });
    return this.state.forTutor(poker);
  }

  private async assertCanStart(session: Session): Promise<void> {
    const reason = pokerBlockReason(
      session,
      await this.sessions.countReleaseSubmissions(session.id),
    );
    if (reason) throw new ConflictError(POKER_BLOCK_MESSAGES[reason]);
    if (await this.pokers.findOpenBySession(session.id)) {
      throw new ConflictError('Já existe um planning poker aberto nesta sessão.');
    }
  }
}
