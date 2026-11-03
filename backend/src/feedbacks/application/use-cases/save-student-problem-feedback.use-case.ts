import { Inject, Injectable } from '@nestjs/common';
import { RoomAccessService } from '@/rooms/application/services/room-access.service';
import {
  PROBLEM_REPOSITORY,
  type ProblemRepository,
} from '@/problems/domain/repositories/problem.repository';
import { NotFoundError, UnprocessableEntityError } from '@/shared/errors/application.error';
import {
  FEEDBACK_REPOSITORY,
  type FeedbackRepository,
} from '../../domain/repositories/feedback.repository';
import { Feedback } from '../../domain/entities/feedback.entity';
import { FeedbackScope } from '../../domain/enums/feedback-scope.enum';

export interface SaveStudentProblemFeedbackInput {
  roomId: string;
  problemId: string;
  studentId: string;
  tutorId: string;
  score: number | null;
  text: string;
  justification?: string | null;
}

@Injectable()
export class SaveStudentProblemFeedbackUseCase {
  constructor(
    @Inject(FEEDBACK_REPOSITORY)
    private readonly feedbackRepository: FeedbackRepository,
    @Inject(PROBLEM_REPOSITORY)
    private readonly problemRepository: ProblemRepository,
    private readonly roomAccessService: RoomAccessService,
  ) {}

  async execute(input: SaveStudentProblemFeedbackInput): Promise<Feedback> {
    await this.validateAccessAndEnrollment(input);

    const existing = await this.feedbackRepository.findStudentProblemFeedback(
      input.problemId,
      input.studentId,
    );

    if (existing) {
      this.validateGradeAdjustment(existing, input);
      const revision = existing.update(input.score, input.text, input.tutorId, input.justification);
      return this.feedbackRepository.saveWithRevision(existing, revision);
    }

    return this.createAndSave(input);
  }

  private createAndSave(input: SaveStudentProblemFeedbackInput): Promise<Feedback> {
    const feedback = Feedback.create({
      authorId: input.tutorId,
      problemId: input.problemId,
      recipientId: input.studentId,
      scope: FeedbackScope.STUDENT,
      score: input.score,
      text: input.text,
    });
    return this.feedbackRepository.saveWithRevision(feedback, null);
  }

  private validateGradeAdjustment(
    existing: Feedback,
    input: SaveStudentProblemFeedbackInput,
  ): void {
    if (existing.score === null || input.score === null) return;
    if (Math.abs(Number(existing.score) - Number(input.score)) < 0.005) return;

    const trimmed = input.justification?.trim() ?? '';
    if (trimmed.length < 10) {
      throw new UnprocessableEntityError(
        'A justificativa do ajuste é obrigatória quando a nota é alterada (mínimo de 10 caracteres).',
      );
    }
    if (trimmed.length > 500) {
      throw new UnprocessableEntityError('A justificativa deve ter no máximo 500 caracteres.');
    }
  }

  private async validateAccessAndEnrollment(input: SaveStudentProblemFeedbackInput): Promise<void> {
    await this.roomAccessService.assertTutorCanAccessRoom(input.roomId, input.tutorId);
    await this.assertProblemBelongsToRoom(input.problemId, input.roomId);

    const isEnrolled = await this.feedbackRepository.isStudentEnrolledInRoom(
      input.roomId,
      input.studentId,
    );

    if (!isEnrolled) {
      throw new UnprocessableEntityError('O aluno não está matriculado nesta sala.');
    }
  }

  private async assertProblemBelongsToRoom(problemId: string, roomId: string): Promise<void> {
    const problem = await this.problemRepository.findById(problemId);
    if (!problem || problem.roomId !== roomId) {
      throw new NotFoundError('Problema não encontrado.');
    }
  }
}
