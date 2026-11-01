import { Inject, Injectable } from '@nestjs/common';
import { SessionAccessService } from '@/sessions/application/services/session-access.service';
import { UserType } from '@/users/domain/enums/user-type.enum';
import {
  InvalidRequestError,
  LockedError,
  UnprocessableEntityError,
} from '@/shared/errors/application.error';
import { AttendanceStatus } from '@/sessions/domain/enums/attendance-status.enum';
import type { RecordedAttendance } from '@/sessions/domain/roll-call/roll-call';
import {
  ATTENDANCE_REPOSITORY,
  type AttendanceRepository,
} from '@/sessions/domain/repositories/attendance.repository';
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
    @Inject(ATTENDANCE_REPOSITORY) private readonly attendances: AttendanceRepository,
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
    const records = await this.attendances.findBySession(sessionId);
    if (records.length === 0) {
      throw new LockedError('A chamada da sessão ainda não foi realizada pelo professor.');
    }
    this.assertEvaluatorPresent(records, studentId);
    this.assertPeerPresent(records, peerId);
  }

  private assertEvaluatorPresent(records: RecordedAttendance[], studentId: string): void {
    if (!this.isPresent(records, studentId)) {
      throw new LockedError('Apenas alunos que participaram da sessão podem avaliar colegas.');
    }
  }

  private assertPeerPresent(records: RecordedAttendance[], peerId: string): void {
    if (!this.isPresent(records, peerId)) {
      throw new InvalidRequestError(
        'Não é possível avaliar um aluno que não esteve presente nesta sessão.',
      );
    }
  }

  private isPresent(records: RecordedAttendance[], studentId: string): boolean {
    const record = records.find((r) => r.studentId === studentId);
    return record?.status === AttendanceStatus.PRESENT || record?.status === AttendanceStatus.LATE;
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
        notaMaxima: 10,
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
