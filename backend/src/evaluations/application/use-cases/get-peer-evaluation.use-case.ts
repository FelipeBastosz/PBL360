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
    papel?: string | null;
  };
  status: EvaluationStatusResponse;
  enviadaEm: Date | null;
  notaCargo?: number | null;
  formula?: { criteriaWeight: number; roleWeight: number };
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
    const peer = detail.peer;
    return {
      colega: { alunoId: peer.id, nome: peer.name, papel: peer.papel ?? detail.papel ?? null },
      status: this.mapStatus(detail),
      enviadaEm: detail.evaluation?.submittedAt ?? null,
      notaCargo: detail.evaluation?.appliedBonus ?? null,
      formula: detail.config.formula ?? { criteriaWeight: 70, roleWeight: 30 },
      criterios: mapPeerCriteria(detail.config.criteria),
      itens: mapPeerItems(detail.evaluation?.items),
    };
  }

  private mapStatus(detail: PeerEvaluationDetail): EvaluationStatusResponse {
    if (detail.evaluation === null) return EvaluationStatusResponse.PENDENTE;
    return detail.evaluation.status === EvaluationStatus.DRAFT
      ? EvaluationStatusResponse.RASCUNHO
      : EvaluationStatusResponse.ENVIADA;
  }
}

const mapPeerCriteria = (criteria: PeerEvaluationDetail['config']['criteria']) =>
  criteria.map((c) => ({
    id: c.id,
    nome: c.name,
    peso: c.weight,
    notaMaxima: 10,
  }));

const mapPeerItems = (items?: Array<{ criterionId: string; score: number }>) =>
  (items ?? []).map((item) => ({
    criterioId: item.criterionId,
    nota: item.score,
  }));
