import { Inject, Injectable } from '@nestjs/common';
import { SessionAccessService } from '@/sessions/application/services/session-access.service';
import { UserType } from '@/users/domain/enums/user-type.enum';
import { LockedError, UnprocessableEntityError } from '@/shared/errors/application.error';
import { EvaluationStatus } from '../../domain/enums/evaluation-status.enum';
import {
  EVALUATION_REPOSITORY,
  type EvaluationRepository,
  type PeerEvaluationDetail,
} from '../../domain/repositories/evaluation.repository';
import type { CriterionScore } from '../../domain/services/evaluation-rules';
import type { GetPeerEvaluationOutput } from './get-peer-evaluation.use-case';
import { EvaluationStatusResponse } from '../dtos/session-evaluation-summary-response.dto';

export interface SavePeerEvaluationInput {
  sessionId: string;
  peerId: string;
  studentId: string;
  itens: CriterionScore[];
  enviar: boolean;
  now?: Date;
}

@Injectable()
export class SavePeerEvaluationUseCase {
  constructor(
    private readonly sessionAccess: SessionAccessService,
    @Inject(EVALUATION_REPOSITORY) private readonly evaluations: EvaluationRepository,
  ) {}

  async execute(input: SavePeerEvaluationInput): Promise<GetPeerEvaluationOutput> {
    const { problem } = await this.validateAccess(input);
    const detail = await this.evaluations.recordPeerEvaluation({
      sessionId: input.sessionId,
      problemId: problem.id,
      evaluatorId: input.studentId,
      peerId: input.peerId,
      items: input.itens,
      submit: input.enviar,
    });
    return this.toOutput(detail);
  }

  private async validateAccess(input: SavePeerEvaluationInput) {
    const { sessionId, peerId, studentId, now = new Date() } = input;
    if (peerId === studentId) {
      throw new UnprocessableEntityError('Um aluno não pode avaliar a si mesmo como par.');
    }
    const context = await this.sessionAccess.assertMemberCanAccessSession(sessionId, {
      id: studentId,
      type: UserType.STUDENT,
    });
    this.assertSessionReleased(context.session, now);
    await this.assertParticipants(sessionId, studentId, peerId);
    return context;
  }

  private assertSessionReleased(
    session: { peerEvalReleased: boolean; peerEvalDeadline?: Date | null },
    now: Date,
  ): void {
    if (!session.peerEvalReleased) {
      throw new LockedError('A avaliação entre pares não está liberada.');
    }
    if (session.peerEvalDeadline && session.peerEvalDeadline <= now) {
      throw new LockedError('O prazo para avaliação entre pares expirou.');
    }
  }

  private async assertParticipants(
    sessionId: string,
    studentId: string,
    peerId: string,
  ): Promise<void> {
    const evaluatorOk = await this.evaluations.isStudentParticipating(sessionId, studentId);
    if (!evaluatorOk) {
      throw new LockedError('Apenas alunos que participaram da sessão podem avaliar colegas.');
    }
    const peerOk = await this.evaluations.isStudentParticipating(sessionId, peerId);
    if (!peerOk) {
      throw new UnprocessableEntityError('O colega não participou da sessão.');
    }
  }

  private toOutput(detail: PeerEvaluationDetail): GetPeerEvaluationOutput {
    return {
      colega: { alunoId: detail.peer.id, nome: detail.peer.name },
      status: this.mapStatus(detail),
      enviadaEm: detail.evaluation?.submittedAt ?? null,
      criterios: detail.config.criteria.map((c) => ({
        id: c.id,
        nome: c.name,
        peso: c.weight,
        notaMaxima: c.maxScore ?? 10,
      })),
      itens: (detail.evaluation?.items ?? []).map((item) => ({
        criterioId: item.criterionId,
        nota: item.score,
      })),
    };
  }

  private mapStatus(detail: PeerEvaluationDetail): EvaluationStatusResponse {
    return detail.evaluation?.status === EvaluationStatus.SUBMITTED
      ? EvaluationStatusResponse.ENVIADA
      : EvaluationStatusResponse.RASCUNHO;
  }
}
