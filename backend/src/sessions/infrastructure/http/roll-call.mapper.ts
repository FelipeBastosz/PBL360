import {
  ATTENDANCE_STATUS_TO_DOMAIN,
  DOMAIN_TO_ATTENDANCE_STATUS,
  DOMAIN_TO_ROLL_CALL_ORIGIN,
  type RecordRollCallDto,
  type RollCallResponseDto,
  type RollCallStudentResponseDto,
} from '../../application/dtos/roll-call.dto';
import type { AttendanceEntry, RollCall, RollCallStudent } from '../../domain/roll-call/roll-call';

export const toAttendanceEntries = (dto: RecordRollCallDto): AttendanceEntry[] =>
  dto.registros.map((record) => ({
    studentId: record.alunoId,
    status: ATTENDANCE_STATUS_TO_DOMAIN[record.status],
    seatNumber: record.lugar ?? null,
    justification: record.justificativa ?? null,
  }));

const toStudentResponse = (student: RollCallStudent): RollCallStudentResponseDto => ({
  alunoId: student.studentId,
  nome: student.name,
  iniciais: student.initials,
  lugar: student.seatNumber,
  status: student.status === null ? null : DOMAIN_TO_ATTENDANCE_STATUS[student.status],
  justificativa: student.justification,
});

export const toRollCallResponse = (rollCall: RollCall): RollCallResponseDto => ({
  sessaoId: rollCall.sessionId,
  origem: DOMAIN_TO_ROLL_CALL_ORIGIN[rollCall.origin],
  sessaoReferencia: rollCall.referenceSession
    ? { id: rollCall.referenceSession.id, data: rollCall.referenceSession.date }
    : null,
  registradaEm: rollCall.recordedAt,
  lugares: rollCall.seats,
  alunos: rollCall.students.map(toStudentResponse),
  totais: {
    presentes: rollCall.totals.present,
    atrasados: rollCall.totals.late,
    justificados: rollCall.totals.excused,
    ausentes: rollCall.totals.absent,
    semRegistro: rollCall.totals.unrecorded,
  },
});
