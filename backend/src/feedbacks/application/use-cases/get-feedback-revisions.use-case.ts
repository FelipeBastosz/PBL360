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
  type FeedbackRevisionItem,
} from '../../domain/repositories/feedback.repository';
import type { Feedback } from '../../domain/entities/feedback.entity';

export interface GetFeedbackRevisionsInput {
  feedbackId: string;
  tutorId: string;
}

@Injectable()
export class GetFeedbackRevisionsUseCase {
  constructor(
    @Inject(FEEDBACK_REPOSITORY)
    private readonly feedbackRepository: FeedbackRepository,
    @Inject(PROBLEM_REPOSITORY)
    private readonly problemRepository: ProblemRepository,
    private readonly roomAccessService: RoomAccessService,
  ) {}

  async execute(input: GetFeedbackRevisionsInput): Promise<FeedbackRevisionItem[]> {
    const feedback = await this.feedbackRepository.findById(input.feedbackId);
    if (!feedback) {
      throw new NotFoundError('Feedback não encontrado.');
    }

    await this.validateRoomAccess(feedback, input.tutorId);

    return this.feedbackRepository.findRevisionsByFeedbackId(input.feedbackId);
  }

  private async validateRoomAccess(feedback: Feedback, tutorId: string): Promise<void> {
    const problem = await this.problemRepository.findById(feedback.problemId);
    if (!problem) {
      throw new NotFoundError('Problema não encontrado.');
    }

    await this.roomAccessService.assertTutorCanAccessRoom(problem.roomId, tutorId);
  }
}
