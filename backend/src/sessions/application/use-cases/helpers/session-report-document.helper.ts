import { EvaluationStatus } from '@/evaluations/domain/enums/evaluation-status.enum';
import { SessionGradeCalculator } from '@/evaluations/domain/services/session-grade-calculator';
import { AttendanceStatus } from '@/sessions/domain/enums/attendance-status.enum';
import { SessionRole } from '@/sessions/domain/enums/session-role.enum';
import {
  ReportColumnType,
  type ReportCellValue,
  type ReportColumn,
  type ReportDocument,
  type ReportFileFormat,
  type ReportSection,
} from '@/report-files/domain/report-document';
import { buildFeedbackEntries } from './session-report-feedback.helper';
import type {
  SessionReportData,
  SessionReportStudentData,
} from '../../../domain/repositories/session-report.repository';

const ATTENDANCE_LABELS: Record<AttendanceStatus, string> = {
  [AttendanceStatus.PRESENT]: 'Presente',
  [AttendanceStatus.LATE]: 'Atrasado',
  [AttendanceStatus.EXCUSED]: 'Justificado',
  [AttendanceStatus.ABSENT]: 'Ausente',
};

const ROLE_LABELS: Record<SessionRole, string> = {
  [SessionRole.COORDINATOR]: 'Coordenador',
  [SessionRole.BOARD_SECRETARY]: 'Secretário do quadro',
  [SessionRole.TABLE_SECRETARY]: 'Secretário da mesa',
};

export const SESSION_REPORT_COLUMNS: ReportColumn[] = [
  { header: 'Aluno', type: ReportColumnType.TEXT },
  { header: 'Matrícula', type: ReportColumnType.TEXT },
  { header: 'Chamada', type: ReportColumnType.TEXT },
  { header: 'Papel', type: ReportColumnType.TEXT },
  { header: 'Nota adicional de papel', type: ReportColumnType.NUMBER, decimals: 2 },
  { header: 'Marcações', type: ReportColumnType.TEXT },
  { header: 'Situação da nota', type: ReportColumnType.TEXT },
  { header: 'Nota', type: ReportColumnType.NUMBER, decimals: 2 },
];

export function formatSessionDate(date: string | Date | null | undefined): string {
  if (!date) return '—';
  if (typeof date === 'string') {
    const parts = date.split('T')[0]?.split('-');
    if (parts && parts.length === 3 && parts[0] && parts[1] && parts[2]) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
  }
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return String(date);
  const day = String(d.getUTCDate()).padStart(2, '0');
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${d.getUTCFullYear()}`;
}

const getAttendance = (s: AttendanceStatus | string | null) =>
  s ? (ATTENDANCE_LABELS[s as AttendanceStatus] ?? s) : 'Não registrada';
const getRole = (r: SessionRole | string | null) =>
  r ? (ROLE_LABELS[r as SessionRole] ?? r) : null;

export function buildStudentRow(
  student: SessionReportStudentData,
  data: SessionReportData,
  hiddenStudentName: boolean,
  showTags: boolean,
): ReportCellValue[] {
  const { gradeStatus, grade } = calculateStudentGrade(student, data);
  const score =
    student.evaluationStatus === EvaluationStatus.SUBMITTED
      ? student.appliedBonus
      : student.roleScore;

  return [
    !hiddenStudentName ? student.name : null,
    student.matricula ?? null,
    getAttendance(student.attendanceStatus),
    getRole(student.role),
    score !== null && score !== undefined ? Number(score) : null,
    showTags && student.tags.length > 0 ? student.tags.join(', ') : null,
    gradeStatus,
    grade,
  ];
}



export function calculateStudentGrade(
  student: SessionReportStudentData,
  data?: SessionReportData,
): { gradeStatus: string; grade: number | null } {
  if (student.evaluationStatus === EvaluationStatus.DRAFT) {
    return { gradeStatus: 'Rascunho', grade: null };
  }
  if (student.evaluationStatus !== EvaluationStatus.SUBMITTED) {
    return { gradeStatus: 'Não registrada', grade: null };
  }

  const rawGrade =
    student.sessionScore !== undefined && student.sessionScore !== null
      ? student.sessionScore
      : computeCalculatedGrade(student, data);

  const grade =
    rawGrade !== null && rawGrade !== undefined && Number.isFinite(rawGrade)
      ? Math.round((rawGrade + Number.EPSILON) * 100) / 100
      : null;

  return { gradeStatus: 'Nota enviada', grade };
}

function tryCalcGrade(student: SessionReportStudentData, data: SessionReportData): number | null {
  const bonus =
    student.evaluationStatus === EvaluationStatus.SUBMITTED
      ? student.appliedBonus
      : (student.appliedBonus ?? student.roleScore);
  try {
    return SessionGradeCalculator.calculate(
      student.items ?? [],
      (data.criteria ?? []) as unknown as Parameters<typeof SessionGradeCalculator.calculate>[1],
      bonus,
      true,
      data.formula,
    );
  } catch {
    return student.recordedSessionScore ?? null;
  }
}

function computeCalculatedGrade(
  student: SessionReportStudentData,
  data?: SessionReportData,
): number | null {
  if (!data) return student.recordedSessionScore ?? null;
  const canCalc = (data.criteria?.length ?? 0) > 0 && (student.items?.length ?? 0) > 0;
  const grade = canCalc ? tryCalcGrade(student, data) : (student.recordedSessionScore ?? null);
  return grade !== null && Number.isFinite(grade)
    ? Math.round((grade + Number.EPSILON) * 100) / 100
    : null;
}

function toLabel(prefix: string, title: string, orderIndex: number | null): string {
  return orderIndex ? `${prefix} ${orderIndex} — ${title}` : title;
}

function buildReportIdentification(data: SessionReportData) {
  return [
    { label: 'Turma', value: data.room.name },
    { label: 'Problema', value: toLabel('Problema', data.problem.title, data.problem.orderIndex) },
    { label: 'Sessão', value: toLabel('Sessão', data.session.title, data.session.orderIndex) },
    { label: 'Data', value: formatSessionDate(data.session.date) },
  ];
}

function buildReportSections(
  data: SessionReportData,
  ocultarNome: boolean,
  mostrarFeedBack: boolean,
  mostrarMarcacoes: boolean,
): ReportSection[] {
  const sections: ReportSection[] = [
    {
      kind: 'table',
      title: 'Dados da sessão',
      columns: SESSION_REPORT_COLUMNS,
      rows: data.students.map((s) => buildStudentRow(s, data, ocultarNome, mostrarMarcacoes)),
    },
  ];
  if (mostrarFeedBack) {
    sections.push({
      kind: 'text',
      title: 'Feedbacks da sessão',
      entries: buildFeedbackEntries(data, ocultarNome),
    });
  }
  return sections;
}

export function buildSessionFileName(data: SessionReportData): string {
  const { session, problem } = data;
  if (
    problem?.orderIndex !== null &&
    problem?.orderIndex !== undefined &&
    session?.orderIndex !== null &&
    session?.orderIndex !== undefined
  ) {
    return `relatorio-sessao-p${problem.orderIndex}-s${session.orderIndex}`;
  }
  if (session?.orderIndex !== null && session?.orderIndex !== undefined) {
    return `relatorio-sessao-s${session.orderIndex}`;
  }
  return `relatorio-sessao-${session.title}`;
}

export function buildSessionReportDocument(
  format: ReportFileFormat,
  data: SessionReportData,
  options: { ocultarNome?: boolean; mostrarFeedBack?: boolean; mostrarMarcacoes?: boolean } = {},
): ReportDocument {
  const { session } = data;
  const fileName = buildSessionFileName(data);

  return {
    format,
    title: `Relatório da sessão — ${session.title}`,
    fileName,
    identification: buildReportIdentification(data),
    sections: buildReportSections(
      data,
      options.ocultarNome ?? false,
      options.mostrarFeedBack ?? false,
      options.mostrarMarcacoes ?? false,
    ),
  };
}
