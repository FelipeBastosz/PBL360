import { Inject, Injectable } from '@nestjs/common';
import { SessionAccessService } from '@/sessions/application/services/session-access.service';
import {
  EVALUATION_REPOSITORY,
  type EvaluationRepository,
} from '../../domain/repositories/evaluation.repository';

@Injectable()
export class GetProblemEvaluationCriteriaUseCase {
  constructor(
    private readonly access: SessionAccessService,
    @Inject(EVALUATION_REPOSITORY) private readonly evaluations: EvaluationRepository,
  ) {}

  async execute(roomId: string, problemId: string, authorId: string) {
    await this.access.assertTutorCanAccessProblem(roomId, problemId, authorId);
    return this.evaluations.getProblemCriteria(problemId);
  }
}
