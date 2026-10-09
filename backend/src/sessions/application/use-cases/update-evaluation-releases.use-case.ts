import { Inject, Injectable } from '@nestjs/common';

import { ConflictError, InvalidRequestError } from '@/shared/errors/application.error';

import type { EvaluationReleaseChange } from '../../domain/entities/evaluation-release';
import {
  SESSION_REPOSITORY,
  type SessionRepository,
} from '../../domain/repositories/session.repository';
import { SessionAccessService } from '../services/session-access.service';
import {
  toEvaluationReleasesOutput,
  type EvaluationReleasesOutput,
} from './helpers/evaluation-releases.helper';

export interface UpdateEvaluationReleasesInput {
  sessionId: string;
  tutorId: string;
  self?: EvaluationReleaseChange;
  peer?: EvaluationReleaseChange;
}

@Injectable()
export class UpdateEvaluationReleasesUseCase {
  constructor(
    @Inject(SESSION_REPOSITORY)
    private readonly repository: SessionRepository,
    private readonly sessionAccess: SessionAccessService,
  ) {}

  async execute(input: UpdateEvaluationReleasesInput): Promise<EvaluationReleasesOutput> {
    if (!input.self && !input.peer) {
      throw new InvalidRequestError('Informe a autoavaliação, os pares ou ambos.');
    }
    const { session } = await this.sessionAccess.assertTutorCanAccessSessionById(
      input.sessionId,
      input.tutorId,
    );
    const submissions = await this.repository.countReleaseSubmissions(session.id);
    if (!submissions.rollCallSaved) {
      throw new ConflictError('Salve a chamada da sessão antes de liberar as avaliações.');
    }

    const now = new Date();
    if (input.self) session.changeRelease('self', input.self, input.tutorId, now);
    if (input.peer) session.changeRelease('peer', input.peer, input.tutorId, now);
    if (session.selfEvalReleased && session.peerEvalReleased) {
      throw new ConflictError(
        'A autoavaliação e os pares não podem ficar liberados ao mesmo tempo. Desligue um para ligar o outro.',
      );
    }

    return toEvaluationReleasesOutput(await this.repository.save(session), submissions);
  }
}
