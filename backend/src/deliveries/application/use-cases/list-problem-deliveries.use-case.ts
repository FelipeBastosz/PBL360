import { Inject, Injectable } from '@nestjs/common';
import {
  PROBLEM_REPOSITORY,
  type ProblemRepository,
} from '@/problems/domain/repositories/problem.repository';
import {
  RoomAccessService,
  type RoomMember,
} from '@/rooms/application/services/room-access.service';
import { NotFoundError } from '@/shared/errors/application.error';
import { UserType } from '@/users/domain/enums/user-type.enum';
import {
  PROBLEM_DELIVERY_REPOSITORY,
  type ProblemDeliveryRepository,
  type ProblemDeliverySummary,
} from '../../domain/repositories/problem-delivery.repository';

export interface ListProblemDeliveriesInput {
  roomId: string;
  problemId: string;
  member: RoomMember;
}

export interface ListProblemDeliveriesOutput {
  myDeliveryId: string | null;
  deliveries: ProblemDeliverySummary[];
}

@Injectable()
export class ListProblemDeliveriesUseCase {
  constructor(
    @Inject(PROBLEM_DELIVERY_REPOSITORY)
    private readonly deliveries: ProblemDeliveryRepository,
    @Inject(PROBLEM_REPOSITORY)
    private readonly problems: ProblemRepository,
    private readonly roomAccess: RoomAccessService,
  ) {}

  async execute(input: ListProblemDeliveriesInput): Promise<ListProblemDeliveriesOutput> {
    await this.roomAccess.assertMemberCanAccessRoom(input.roomId, input.member);
    await this.assertProblemBelongsToRoom(input.roomId, input.problemId);
    if (input.member.type === UserType.TUTOR) {
      const deliveries = await this.deliveries.listActiveByProblem(input.problemId);
      return { myDeliveryId: null, deliveries };
    }
    const own = await this.deliveries.findActiveByProblemAndStudent(
      input.problemId,
      input.member.id,
    );
    return { myDeliveryId: own?.id ?? null, deliveries: own ? [own] : [] };
  }

  private async assertProblemBelongsToRoom(roomId: string, problemId: string): Promise<void> {
    const problem = await this.problems.findById(problemId);
    if (!problem || problem.roomId !== roomId) {
      throw new NotFoundError('Problema não encontrado.');
    }
  }
}
