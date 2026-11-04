import type { AttendanceStatus } from '../../domain/enums/attendance-status.enum';
import type { EvaluationSummary } from '@/evaluations/domain/repositories/evaluation.repository';
import type {
  SessionReportData,
  SessionReportStudentData,
} from '../../domain/repositories/session-report.repository';
import type {
  EvaluationRow,
  RoleRow,
  SessionReportRawData,
  StudentRow,
} from './session-report.types';

export * from './session-report.types';

interface StudentMappingContext {
  attendances: Map<string, AttendanceStatus | string>;
  roles: Map<string, RoleRow>;
  tags: Map<string, string[]>;
  evals: Map<string, EvaluationRow>;
  feedbacks: Map<string, { text: string; authorName: string }>;
  summaries: Map<string, EvaluationSummary>;
}

const num = (v: string | number | null | undefined): number | null =>
  v !== null && v !== undefined ? Number(v) : null;

function mapStudentData(student: StudentRow, ctx: StudentMappingContext): SessionReportStudentData {
  const role = ctx.roles.get(student.studentId);
  const ev = ctx.evals.get(student.studentId);
  return {
    studentId: student.studentId,
    name: student.name,
    matricula: student.matricula,
    attendanceStatus: ctx.attendances.get(student.studentId) ?? null,
    role: role?.role ?? null,
    roleScore: num(role?.roleScore),
    tags: ctx.tags.get(student.studentId) ?? [],
    evaluationStatus: ctx.summaries.get(student.studentId)?.status ?? ev?.status ?? null,
    appliedBonus: num(ev?.appliedBonus),
    feedback: ctx.feedbacks.get(student.studentId) ?? null,
  };
}

function buildStudentContext(raw: SessionReportRawData): StudentMappingContext {
  const fbEntries = raw.feedbacks
    .filter((f) => f.recipientId !== null)
    .map((f) => [f.recipientId!, { text: f.text, authorName: f.authorName }] as const);
  return {
    attendances: new Map(raw.attendances.map((a) => [a.studentId, a.status])),
    roles: new Map(raw.roles.map((r) => [r.studentId, r])),
    tags: new Map(raw.observations.map((o) => [o.studentId, o.tags])),
    evals: new Map(raw.evaluations.map((e) => [e.studentId, e])),
    feedbacks: new Map(fbEntries),
    summaries: new Map((raw.summaries ?? []).map((s) => [s.studentId, s])),
  };
}

const buildRoom = (raw: SessionReportRawData) => ({
  id: raw.header?.roomId ?? raw.roomId,
  name: raw.header?.roomName ?? '',
  courseCode: raw.header?.courseCode ?? '',
  semester: raw.header?.semester ?? '',
});

function buildHeaderData(raw: SessionReportRawData) {
  const h = raw.header;
  return {
    room: buildRoom(raw),
    problem: {
      id: h?.problemId ?? '',
      title: h?.problemTitle ?? '',
      orderIndex: h?.problemOrderIndex ?? null,
    },
    session: {
      id: h?.sessionId ?? raw.sessionId,
      title: h?.sessionTitle ?? '',
      orderIndex: h?.sessionOrderIndex ?? null,
      date: h?.sessionDate ?? new Date(),
    },
  };
}

export function buildSessionReportData(raw: SessionReportRawData): SessionReportData {
  const ctx = buildStudentContext(raw);
  const genFb = raw.feedbacks.find((f) => f.recipientId === null);
  const { room, problem, session } = buildHeaderData(raw);

  return {
    room,
    problem,
    session,
    students: raw.students.map((s) => mapStudentData(s, ctx)),
    generalFeedback: genFb ? { text: genFb.text, authorName: genFb.authorName } : null,
  };
}
