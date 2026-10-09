import { Inject, Injectable } from '@nestjs/common';

import {
  SESSION_REPOSITORY,
  type SessionRepository,
} from '../../domain/repositories/session.repository';
import { SessionAccessService } from '../services/session-access.service';
import {
  toEvaluationReleasesOutput,
  type EvaluationReleasesOutput,
} from './helpers/evaluation-releases.helper';

export interface GetEvaluationReleasesInput {
  sessionId: string;
  tutorId: string;
}

@Injectable()
export class GetEvaluationReleasesUseCase {
  constructor(
    @Inject(SESSION_REPOSITORY)
    private readonly repository: SessionRepository,
    private readonly sessionAccess: SessionAccessService,
  ) {}

  async execute(input: GetEvaluationReleasesInput): Promise<EvaluationReleasesOutput> {
    const { session } = await this.sessionAccess.assertTutorCanAccessSessionById(
      input.sessionId,
      input.tutorId,
    );
    const submissions = await this.repository.countReleaseSubmissions(session.id);

    return toEvaluationReleasesOutput(session, submissions);
  }
}
