import type { EntityManager } from 'typeorm';
import type { ReceivedSessionComponents } from '../../domain/repositories/received-feedback.repository';
import { calculateProblemGrades } from '@/grades/application/services/problem-grade-calculation';
import {
  readFormulaComponents,
  readProblemGradeData,
} from '@/grades/infrastructure/database/problem-grade-data.reads';

export interface ReceivedFeedbackGrades {
  released: boolean;
  finalScore: number | null;
  sessions: Map<string, number | null>;
  components?: Map<string, ReceivedSessionComponents>;
}

type StudentGrades = ReturnType<typeof calculateProblemGrades>['response']['alunos'][number];
type SessionGrades = StudentGrades['sessoes'][number];
type GradeContext = { roomId: string; problemId: string; studentId: string };

const NOT_RELEASED: ReceivedFeedbackGrades = {
  released: false,
  finalScore: null,
  sessions: new Map(),
  components: new Map(),
};

export async function readReceivedFeedbackGrades(
  manager: EntityManager,
  roomId: string,
  problemId: string,
  studentId: string,
): Promise<ReceivedFeedbackGrades> {
  const context = { roomId, problemId, studentId };
  const tutorReleased = await readTutorReleasedSessions(manager, problemId, studentId);
  const everything = await calculateStudentGrades(manager, context, null);
  const activeIds = (everything?.sessoes ?? []).filter(isActiveNonTutor).map(toSessionId);
  const ids = new Set([...tutorReleased, ...activeIds]);
  if (ids.size === 0) return NOT_RELEASED;
  return toReceivedGrades(await calculateStudentGrades(manager, context, ids));
}

async function readTutorReleasedSessions(
  manager: EntityManager,
  problemId: string,
  studentId: string,
): Promise<string[]> {
  const rows = await manager.query<{ sessionId: string }[]>(
    `SELECT e.session_id AS "sessionId" FROM evaluations e
       JOIN sessions s ON s.id = e.session_id AND s.problem_id = e.problem_id
      WHERE e.problem_id = $1 AND e.student_id = $2
        AND e.type = 'TUTOR_SESSION' AND e.status = 'SUBMITTED'`,
    [problemId, studentId],
  );
  return rows.map((row) => row.sessionId);
}

async function calculateStudentGrades(
  manager: EntityManager,
  context: GradeContext,
  releasedIds: Set<string> | null,
): Promise<StudentGrades | undefined> {
  const data = await readProblemGradeData(manager, context.roomId, context.problemId);
  if (releasedIds) {
    data.sessions = data.sessions.filter((session) => releasedIds.has(String(session.id)));
  }
  data.students = data.students.filter((student) => student.id === context.studentId);
  const components = await readFormulaComponents(
    manager,
    data.formulas.map((formula) => formula.id),
  );
  return calculateProblemGrades(data, components).response.alunos[0];
}

const toSessionId = (session: SessionGrades) => session.sessaoId;

const isActiveNonTutor = (session: SessionGrades): boolean =>
  (session.modalidade === 'AUTOAVALIACAO' || session.modalidade === 'PARES') &&
  session.nota !== null;

function toActiveComponents(session: SessionGrades): ReceivedSessionComponents | null {
  if (session.modalidade === 'AUTOAVALIACAO') {
    return {
      modalidade: 'AUTOAVALIACAO',
      autoavaliacao: session.autoavaliacao ?? null,
      pares: null,
    };
  }
  if (session.modalidade === 'PARES') {
    return { modalidade: 'PARES', autoavaliacao: null, pares: session.pares ?? null };
  }
  return null;
}

function toReceivedGrades(student: StudentGrades | undefined): ReceivedFeedbackGrades {
  const sessions = student?.sessoes ?? [];
  const components = new Map<string, ReceivedSessionComponents>();
  for (const session of sessions) {
    const active = toActiveComponents(session);
    if (active) components.set(session.sessaoId, active);
  }
  return {
    released: true,
    finalScore: student?.notaFinal ?? null,
    sessions: new Map(sessions.map((session) => [session.sessaoId, session.nota])),
    components,
  };
}
