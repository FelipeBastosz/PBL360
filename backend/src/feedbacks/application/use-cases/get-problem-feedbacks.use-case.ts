import { Inject, Injectable } from '@nestjs/common';
import { RoomAccessService } from '@/rooms/application/services/room-access.service';
import {
  PROBLEM_REPOSITORY,
  type ProblemRepository,
} from '@/problems/domain/repositories/problem.repository';
import { NotFoundError } from '@/shared/errors/application.error';
import {
  FEEDBACK_REPOSITORY,
  type FeedbackRepository,
  type FeedbackWithStudent,
} from '../../domain/repositories/feedback.repository';
import type { Feedback } from '../../domain/entities/feedback.entity';

export interface GetProblemFeedbacksInput {
  roomId: string;
  problemId: string;
  tutorId: string;
}

export interface GetProblemFeedbacksOutput {
  general: Feedback | null;
  students: FeedbackWithStudent[];
}

@Injectable()
export class GetProblemFeedbacksUseCase {
  constructor(
    @Inject(FEEDBACK_REPOSITORY)
    private readonly feedbackRepository: FeedbackRepository,
    @Inject(PROBLEM_REPOSITORY)
    private readonly problemRepository: ProblemRepository,
    private readonly roomAccessService: RoomAccessService,
  ) {}

  async execute(input: GetProblemFeedbacksInput): Promise<GetProblemFeedbacksOutput> {
    await this.validateRoomAndProblem(input.roomId, input.problemId, input.tutorId);

    const [general, students] = await Promise.all([
      this.feedbackRepository.findGeneralProblemFeedback(input.problemId),
      this.feedbackRepository.listStudentsWithProblemFeedbacks(input.roomId, input.problemId),
    ]);

    return { general, students };
  }

  private async validateRoomAndProblem(
    roomId: string,
    problemId: string,
    tutorId: string,
  ): Promise<void> {
    await this.roomAccessService.assertTutorCanAccessRoom(roomId, tutorId);
    const problem = await this.problemRepository.findById(problemId);
    if (!problem || problem.roomId !== roomId) {
      throw new NotFoundError('Problema não encontrado.');
    }
  }
}
