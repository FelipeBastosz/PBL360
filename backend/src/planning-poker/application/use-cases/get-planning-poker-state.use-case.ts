import { Injectable } from '@nestjs/common';
import type { RoomMember } from '@/rooms/application/services/room-access.service';
import { UserType } from '@/users/domain/enums/user-type.enum';
import { PokerContextService } from '../services/poker-context.service';
import { PokerStateService } from '../services/poker-state.service';
import type { StudentPokerState, TutorPokerState } from '../services/poker-views';

export type PlanningPokerStateOutput =
  { audience: 'TUTOR'; state: TutorPokerState } | { audience: 'STUDENT'; state: StudentPokerState };

@Injectable()
export class GetPlanningPokerStateUseCase {
  constructor(
    private readonly context: PokerContextService,
    private readonly state: PokerStateService,
  ) {}

  async execute(sessionId: string, member: RoomMember): Promise<PlanningPokerStateOutput> {
    const poker = await this.context.forMember(sessionId, member);
    if (member.type === UserType.TUTOR) {
      return { audience: 'TUTOR', state: await this.state.forTutor(poker) };
    }
    return { audience: 'STUDENT', state: await this.state.forStudent(poker, member.id) };
  }
}
