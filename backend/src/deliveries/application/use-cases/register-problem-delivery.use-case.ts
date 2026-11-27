import { Inject, Injectable } from '@nestjs/common';
import {
  PROBLEM_REPOSITORY,
  type ProblemRepository,
} from '@/problems/domain/repositories/problem.repository';
import { RoomAccessService } from '@/rooms/application/services/room-access.service';
import { NotFoundError } from '@/shared/errors/application.error';
import { UserType } from '@/users/domain/enums/user-type.enum';
import { ProblemDelivery } from '../../domain/entities/problem-delivery.entity';
import {
  PROBLEM_DELIVERY_REPOSITORY,
  type ProblemDeliveryRepository,
  type ProblemDeliverySummary,
} from '../../domain/repositories/problem-delivery.repository';

export interface RegisterProblemDeliveryInput {
  roomId: string;
  problemId: string;
  studentId: string;
  url: string;
}

@Injectable()
export class RegisterProblemDeliveryUseCase {
  constructor(
    @Inject(PROBLEM_DELIVERY_REPOSITORY)
    private readonly deliveries: ProblemDeliveryRepository,
    @Inject(PROBLEM_REPOSITORY)
    private readonly problems: ProblemRepository,
    private readonly roomAccess: RoomAccessService,
  ) {}

  async execute(input: RegisterProblemDeliveryInput): Promise<ProblemDeliverySummary> {
    await this.roomAccess.assertMemberCanAccessRoom(input.roomId, {
      id: input.studentId,
      type: UserType.STUDENT,
    });
    await this.assertProblemBelongsToRoom(input.roomId, input.problemId);
    const delivery = ProblemDelivery.create({
      roomId: input.roomId,
      problemId: input.problemId,
      submittedBy: input.studentId,
      url: input.url,
    });
    return this.deliveries.registerForStudent(delivery);
  }

  private async assertProblemBelongsToRoom(roomId: string, problemId: string): Promise<void> {
    const problem = await this.problems.findById(problemId);
    if (!problem || problem.roomId !== roomId) {
      throw new NotFoundError('Problema não encontrado.');
    }
  }
}
