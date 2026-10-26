import { Inject, Injectable } from '@nestjs/common';

import { ConflictError, InvalidRequestError } from '@/shared/errors/application.error';

import type { EvaluationReleaseChange } from '../../domain/entities/evaluation-release';
import {
  SESSION_REPOSITORY,
  type ReleaseSubmissions,
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
    this.assertCanRelease(input, submissions);

    const now = new Date();
    if (input.self) session.changeRelease('self', input.self, input.tutorId, now);
    if (input.peer) session.changeRelease('peer', input.peer, input.tutorId, now);
    this.assertReleasesExclusive(session.selfEvalReleased, session.peerEvalReleased);

    return toEvaluationReleasesOutput(await this.repository.save(session), submissions);
  }

  private assertCanRelease(
    input: UpdateEvaluationReleasesInput,
    submissions: ReleaseSubmissions,
  ): void {
    if (!submissions.rollCallSaved) {
      throw new ConflictError('Salve a chamada da sessão antes de liberar as avaliações.');
    }
    this.assertSubmissionsCompatible(input, submissions);
    if ((input.self?.released || input.peer?.released) && submissions.pokerStarted) {
      throw new ConflictError(
        'Esta sessão já usa o planning poker para a avaliação entre pares. Use um ou outro.',
      );
    }
  }

  private assertSubmissionsCompatible(
    input: UpdateEvaluationReleasesInput,
    submissions: ReleaseSubmissions,
  ): void {
    if ((input.self?.released || input.peer?.released) && (submissions.tutorSubmitted ?? 0) > 0) {
      throw new ConflictError('A sessão já possui avaliações do tutor submetidas.');
    }
    if (input.peer?.released && (submissions.selfSubmitted ?? 0) > 0) {
      throw new ConflictError('A sessão já possui autoavaliações submetidas.');
    }
    if (input.self?.released && (submissions.peerSubmitted ?? 0) > 0) {
      throw new ConflictError('A sessão já possui avaliações de pares submetidas.');
    }
  }

  private assertReleasesExclusive(selfReleased: boolean, peerReleased: boolean): void {
    if (selfReleased && peerReleased) {
      throw new ConflictError(
        'A autoavaliação e os pares não podem ficar liberados ao mesmo tempo. Desligue um para ligar o outro.',
      );
    }
  }
}
