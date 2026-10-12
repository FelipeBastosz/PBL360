import { Inject, Injectable } from '@nestjs/common';
import { SessionAccessService } from '@/sessions/application/services/session-access.service';
import { UserType } from '@/users/domain/enums/user-type.enum';
import { EvaluationStatus } from '../../domain/enums/evaluation-status.enum';
import {
  EVALUATION_REPOSITORY,
  type EvaluationRepository,
} from '../../domain/repositories/evaluation.repository';
import { EvaluationStatusResponse } from '../dtos/session-evaluation-summary-response.dto';

export interface ListSessionPeersOutput {
  liberada: boolean;
  prazo: Date | null;
  colegas: Array<{
    alunoId: string;
    nome: string;
    iniciais: string;
    status: EvaluationStatusResponse;
  }>;
}

@Injectable()
export class ListSessionPeersUseCase {
  constructor(
    private readonly sessionAccess: SessionAccessService,
    @Inject(EVALUATION_REPOSITORY) private readonly evaluations: EvaluationRepository,
  ) {}

  async execute(sessionId: string, studentId: string): Promise<ListSessionPeersOutput> {
    const { session } = await this.sessionAccess.assertMemberCanAccessSession(sessionId, {
      id: studentId,
      type: UserType.STUDENT,
    });

    const peers = await this.evaluations.listSessionPeers(sessionId, studentId);

    return {
      liberada: session.peerEvalReleased,
      prazo: session.peerEvalDeadline ?? null,
      colegas: peers.map((peer) => ({
        alunoId: peer.alunoId,
        nome: peer.nome,
        iniciais: this.getInitials(peer.nome),
        status: this.mapStatus(peer.status),
      })),
    };
  }

  private mapStatus(status: EvaluationStatus | null): EvaluationStatusResponse {
    if (status === null) return EvaluationStatusResponse.PENDENTE;
    return status === EvaluationStatus.DRAFT
      ? EvaluationStatusResponse.RASCUNHO
      : EvaluationStatusResponse.ENVIADA;
  }

  private getInitials(name: string): string {
    const parts = name.trim().split(/\s+/);
    const first = parts[0]?.[0] ?? '';
    return (first + (parts.length > 1 ? (parts.at(-1)?.[0] ?? '') : '')).toUpperCase();
  }
}
