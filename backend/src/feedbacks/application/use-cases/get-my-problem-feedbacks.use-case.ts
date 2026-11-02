import { Inject, Injectable } from '@nestjs/common';
import { RoomAccessService } from '@/rooms/application/services/room-access.service';
import {
  PROBLEM_REPOSITORY,
  type ProblemRepository,
} from '@/problems/domain/repositories/problem.repository';
import { NotFoundError } from '@/shared/errors/application.error';
import { UserType } from '@/users/domain/enums/user-type.enum';
import {
  RECEIVED_FEEDBACK_REPOSITORY,
  type ReceivedFeedbackRepository,
} from '../../domain/repositories/received-feedback.repository';

@Injectable()
export class GetMyProblemFeedbacksUseCase {
  constructor(
    private readonly access: RoomAccessService,
    @Inject(PROBLEM_REPOSITORY) private readonly problems: ProblemRepository,
    @Inject(RECEIVED_FEEDBACK_REPOSITORY) private readonly feedbacks: ReceivedFeedbackRepository,
  ) {}

  async execute(roomId: string, problemId: string, studentId: string) {
    await this.access.assertMemberCanAccessRoom(roomId, { id: studentId, type: UserType.STUDENT });
    const problem = await this.problems.findById(problemId);
    if (!problem || problem.roomId !== roomId) throw new NotFoundError('Problema não encontrado.');
    return this.feedbacks.readProblem(problemId, studentId, roomId);
  }
}
