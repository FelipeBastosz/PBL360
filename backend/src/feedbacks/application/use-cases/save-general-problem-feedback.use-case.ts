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
} from '../../domain/repositories/feedback.repository';
import { Feedback } from '../../domain/entities/feedback.entity';
import { FeedbackScope } from '../../domain/enums/feedback-scope.enum';

export interface SaveGeneralProblemFeedbackInput {
  roomId: string;
  problemId: string;
  tutorId: string;
  text: string;
}

@Injectable()
export class SaveGeneralProblemFeedbackUseCase {
  constructor(
    @Inject(FEEDBACK_REPOSITORY)
    private readonly feedbackRepository: FeedbackRepository,
    @Inject(PROBLEM_REPOSITORY)
    private readonly problemRepository: ProblemRepository,
    private readonly roomAccessService: RoomAccessService,
  ) {}

  async execute(input: SaveGeneralProblemFeedbackInput): Promise<Feedback> {
    await this.validateRoomAndProblem(input.roomId, input.problemId, input.tutorId);

    const existing = await this.feedbackRepository.findGeneralProblemFeedback(input.problemId);

    if (existing) {
      const revision = existing.update(null, input.text, input.tutorId);
      return this.feedbackRepository.saveWithRevision(existing, revision);
    }

    const feedback = Feedback.create({
      authorId: input.tutorId,
      problemId: input.problemId,
      scope: FeedbackScope.PROBLEM,
      text: input.text,
    });

    return this.feedbackRepository.saveWithRevision(feedback, null);
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
