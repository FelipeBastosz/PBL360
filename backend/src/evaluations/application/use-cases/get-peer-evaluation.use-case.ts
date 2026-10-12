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
import { EvaluationStatusResponse } from '../dtos/session-evaluation-summary-response.dto';

export interface GetPeerEvaluationOutput {
  colega: {
    alunoId: string;
    nome: string;
  };
  status: EvaluationStatusResponse;
  enviadaEm: Date | null;
  criterios: Array<{
    id: string;
    nome: string;
    peso: number;
    notaMaxima: number;
  }>;
  itens: Array<{
    criterioId: string;
    nota: number;
  }>;
}

@Injectable()
export class GetPeerEvaluationUseCase {
  constructor(
    private readonly sessionAccess: SessionAccessService,
    @Inject(EVALUATION_REPOSITORY) private readonly evaluations: EvaluationRepository,
  ) {}

  async execute(
    sessionId: string,
    peerId: string,
    studentId: string,
  ): Promise<GetPeerEvaluationOutput> {
    const { problem, roomId } = await this.assertAccess(sessionId, peerId, studentId);
    const detail = await this.evaluations.getPeerEvaluation(
      { sessionId, problemId: problem.id, roomId },
      studentId,
      peerId,
    );
    return this.toOutput(detail);
  }

  private async assertAccess(sessionId: string, peerId: string, studentId: string) {
    if (peerId === studentId) {
      throw new UnprocessableEntityError('Um aluno não pode avaliar a si mesmo como par.');
    }
    const context = await this.sessionAccess.assertMemberCanAccessSession(sessionId, {
      id: studentId,
      type: UserType.STUDENT,
    });
    const participating = await this.evaluations.isStudentParticipating(sessionId, studentId);
    if (!participating) {
      throw new LockedError('Apenas alunos que participaram da sessão podem avaliar colegas.');
    }
    return context;
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
    if (detail.evaluation === null) return EvaluationStatusResponse.PENDENTE;
    return detail.evaluation.status === EvaluationStatus.DRAFT
      ? EvaluationStatusResponse.RASCUNHO
      : EvaluationStatusResponse.ENVIADA;
  }
}
