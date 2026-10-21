import type {
  SessionReportData,
  SessionReportStudentData,
} from '../../domain/repositories/session-report.repository';
import type {
  EvaluationItemRow,
  EvaluationRow,
  FormulaComponentRow,
  RoleRow,
  SessionReportRawData,
  StudentRow,
} from './session-report.types';

export * from './session-report.types';

export function extractFormula(rows: FormulaComponentRow[]): {
  criteriaWeight: number;
  roleWeight: number;
} {
  const criteria = rows.find((r) => r.type === 'CRITERIOS');
  const role = rows.find((r) => r.type === 'PAPEL');
  if (criteria && role) {
    return { criteriaWeight: Number(criteria.weight), roleWeight: Number(role.weight) };
  }
  return { criteriaWeight: 70, roleWeight: 30 };
}

export function toItemScoreMap(
  items: EvaluationItemRow[],
): Map<string, Array<{ criterionId: string; score: number }>> {
  const map = new Map<string, Array<{ criterionId: string; score: number }>>();
  for (const item of items) {
    const list = map.get(item.evaluationId) ?? [];
    list.push({ criterionId: item.criterionId, score: Number(item.score) });
    map.set(item.evaluationId, list);
  }
  return map;
}

interface StudentMappingContext {
  attendances: Map<string, string>;
  roles: Map<string, RoleRow>;
  tags: Map<string, string[]>;
  evals: Map<string, EvaluationRow>;
  items: Map<string, Array<{ criterionId: string; score: number }>>;
  feedbacks: Map<string, { text: string; authorName: string }>;
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
    evaluationStatus: ev?.status ?? null,
    appliedBonus: num(ev?.appliedBonus),
    items: ev ? (ctx.items.get(ev.id) ?? []) : [],
    recordedSessionScore: num(ev?.sessionScore),
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
    items: toItemScoreMap(raw.items),
    feedbacks: new Map(fbEntries),
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
    criteria: raw.criteria.map((c) => ({ id: c.id, name: c.name, weight: Number(c.weight) })),
    formula: extractFormula(raw.formulas),
    students: raw.students.map((s) => mapStudentData(s, ctx)),
    generalFeedback: genFb ? { text: genFb.text, authorName: genFb.authorName } : null,
  };
}
