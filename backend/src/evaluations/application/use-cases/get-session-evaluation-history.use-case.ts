import { Inject, Injectable } from '@nestjs/common';
import { EvaluationAccessService } from '../services/evaluation-access.service';
import {
  EVALUATION_HISTORY_REPOSITORY,
  type EvaluationHistoryRepository,
} from '../../domain/repositories/evaluation-history.repository';
import type { SessionEvaluationHistoryItem } from '../../domain/entities/evaluation-history.entity';

@Injectable()
export class GetSessionEvaluationHistoryUseCase {
  constructor(
    private readonly access: EvaluationAccessService,
    @Inject(EVALUATION_HISTORY_REPOSITORY)
    private readonly historyRepo: EvaluationHistoryRepository,
  ) {}

  async execute(sessionId: string, tutorId: string): Promise<SessionEvaluationHistoryItem[]> {
    await this.access.forSession(sessionId, tutorId);
    return this.historyRepo.getHistory(sessionId);
  }
}
