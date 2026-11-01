import { Inject, Injectable } from '@nestjs/common';
import { SessionAccessService } from '@/sessions/application/services/session-access.service';
import { UserType } from '@/users/domain/enums/user-type.enum';
import { AttendanceStatus } from '@/sessions/domain/enums/attendance-status.enum';
import type { EnrolledStudent, RecordedAttendance } from '@/sessions/domain/roll-call/roll-call';
import {
  ATTENDANCE_REPOSITORY,
  type AttendanceRepository,
} from '@/sessions/domain/repositories/attendance.repository';
import { EvaluationStatus } from '../../domain/enums/evaluation-status.enum';
import {
  EVALUATION_REPOSITORY,
  type EvaluationRepository,
} from '../../domain/repositories/evaluation.repository';
import { EvaluationStatusResponse } from '../dtos/session-evaluation-summary-response.dto';

export interface ListSessionPeersOutput {
  liberada: boolean;
  prazo: Date | null;
  chamadaRealizada: boolean;
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
    @Inject(ATTENDANCE_REPOSITORY) private readonly attendances: AttendanceRepository,
  ) {}

  async execute(sessionId: string, studentId: string): Promise<ListSessionPeersOutput> {
    const { session, roomId } = await this.sessionAccess.assertMemberCanAccessSession(sessionId, {
      id: studentId,
      type: UserType.STUDENT,
    });

    const rollCall = await this.attendances.findBySession(sessionId);
    if (rollCall.length === 0) {
      return this.toOutput(session, false, []);
    }
    if (!this.isStudentPresent(rollCall, studentId)) {
      return this.toOutput(session, true, []);
    }

    const colegas = await this.fetchEligiblePeers(sessionId, roomId, studentId, rollCall);
    return this.toOutput(session, true, colegas);
  }

  private isStudentPresent(rollCall: RecordedAttendance[], studentId: string): boolean {
    const record = rollCall.find((r) => r.studentId === studentId);
    return record?.status === AttendanceStatus.PRESENT || record?.status === AttendanceStatus.LATE;
  }

  private async fetchEligiblePeers(
    sessionId: string,
    roomId: string,
    studentId: string,
    rollCall: RecordedAttendance[],
  ): Promise<ListSessionPeersOutput['colegas']> {
    const [enrolled, existingEvaluations] = await Promise.all([
      this.attendances.findEnrolledStudents(roomId),
      this.evaluations.listSessionPeers(sessionId, studentId),
    ]);
    const presentIds = new Set(
      rollCall.filter((r) => this.isStudentPresent(rollCall, r.studentId)).map((r) => r.studentId),
    );
    const statusMap = new Map(existingEvaluations.map((p) => [p.alunoId, p.status]));
    const peers = enrolled.filter((s) => s.id !== studentId && presentIds.has(s.id));
    return this.mapColegas(peers, statusMap);
  }

  private mapColegas(
    peers: EnrolledStudent[],
    statusMap: Map<string, EvaluationStatus | null>,
  ): ListSessionPeersOutput['colegas'] {
    return peers
      .map((p) => ({
        alunoId: p.id,
        nome: p.name,
        iniciais: this.getInitials(p.name),
        status: this.mapStatus(statusMap.get(p.id) ?? null),
      }))
      .sort((a, b) => a.nome.localeCompare(b.nome));
  }

  private toOutput(
    session: { peerEvalReleased: boolean; peerEvalDeadline?: Date | null },
    chamadaRealizada: boolean,
    colegas: ListSessionPeersOutput['colegas'],
  ): ListSessionPeersOutput {
    return {
      liberada: session.peerEvalReleased,
      prazo: session.peerEvalDeadline ?? null,
      chamadaRealizada,
      colegas,
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
