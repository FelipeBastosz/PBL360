import { Inject, Injectable } from '@nestjs/common';
import { EvaluationAccessService } from '../services/evaluation-access.service';
import {
  EVALUATION_REPOSITORY,
  type EvaluationRepository,
} from '../../domain/repositories/evaluation.repository';

@Injectable()
export class ListSessionEvaluationsUseCase {
  constructor(
    private readonly access: EvaluationAccessService,
    @Inject(EVALUATION_REPOSITORY) private readonly evaluations: EvaluationRepository,
  ) {}

  async execute(sessionId: string, authorId: string) {
    const context = await this.access.forSession(sessionId, authorId);
    return this.evaluations.list(context);
  }
}
