import { ForbiddenError } from '@/shared/errors/application.error';
import { Injectable } from '@nestjs/common';
import { UserType } from '@/users/domain/enums/user-type.enum';
import { SessionAccessService } from '../services/session-access.service';
import {
  SESSION_GENERAL_EVALUATION_REPOSITORY,
  type SessionGeneralEvaluationRepository,
} from '../../domain/repositories/session-general-evaluation.repository';
import { Inject } from '@nestjs/common';

@Injectable()
export class SaveSessionGeneralEvaluationUseCase {
  constructor(
    private readonly access: SessionAccessService,
    @Inject(SESSION_GENERAL_EVALUATION_REPOSITORY)
    private readonly evaluations: SessionGeneralEvaluationRepository,
  ) {}

  async execute(sessionId: string, text: string, memberId: string, memberType: UserType) {
    await this.access.assertMemberCanAccessSession(sessionId, { id: memberId, type: memberType });
    if (memberType !== UserType.TUTOR) {
      throw new ForbiddenError('Apenas professores podem registrar a avaliação geral da sessão.');
    }
    const trimmed = text.trim();
    if (!trimmed) {
      await this.evaluations.deleteBySessionAndTutor(sessionId, memberId);
      return null;
    }
    return this.evaluations.save(sessionId, trimmed, memberId);
  }
}
