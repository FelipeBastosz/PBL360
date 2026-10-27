import { Inject, Injectable } from '@nestjs/common';
import { NotFoundError } from '@/shared/errors/application.error';
import { EvaluationAccessService } from '../services/evaluation-access.service';
import {
  EVALUATION_HISTORY_REPOSITORY,
  type EvaluationHistoryRepository,
} from '../../domain/repositories/evaluation-history.repository';
import type { StudentSessionEvaluationComparison } from '../../domain/entities/evaluation-history.entity';

@Injectable()
export class GetStudentSessionEvaluationComparisonUseCase {
  constructor(
    private readonly access: EvaluationAccessService,
    @Inject(EVALUATION_HISTORY_REPOSITORY)
    private readonly historyRepo: EvaluationHistoryRepository,
  ) {}

  async execute(
    sessionId: string,
    studentId: string,
    tutorId: string,
  ): Promise<StudentSessionEvaluationComparison> {
    await this.access.forSession(sessionId, tutorId);

    const comparison = await this.historyRepo.getStudentComparison(sessionId, studentId);
    if (!comparison) {
      throw new NotFoundError('Aluno não participou da sessão.');
    }

    return comparison;
  }
}
