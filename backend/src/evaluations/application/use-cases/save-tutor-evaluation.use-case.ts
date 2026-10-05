import { Inject, Injectable } from '@nestjs/common';
import type { SaveTutorEvaluationInput } from '../inputs/save-tutor-evaluation.input';
import { EvaluationAccessService } from '../services/evaluation-access.service';
import {
  EVALUATION_REPOSITORY,
  type EvaluationRepository,
} from '../../domain/repositories/evaluation.repository';

@Injectable()
export class SaveTutorEvaluationUseCase {
  constructor(
    private readonly access: EvaluationAccessService,
    @Inject(EVALUATION_REPOSITORY) private readonly evaluations: EvaluationRepository,
  ) {}

  async execute(input: SaveTutorEvaluationInput) {
    const context = await this.access.forStudent(input.sessionId, input.studentId, input.authorId);
    return this.evaluations.recordEvaluation({ ...input, context });
  }
}
