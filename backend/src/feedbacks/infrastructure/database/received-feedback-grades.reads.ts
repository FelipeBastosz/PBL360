import type { EntityManager } from 'typeorm';
import { calculateProblemGrades } from '@/grades/application/services/problem-grade-calculation';
import {
  readFormulaComponents,
  readProblemGradeData,
} from '@/grades/infrastructure/database/problem-grade-data.reads';

export interface ReceivedFeedbackGrades {
  released: boolean;
  finalScore: number | null;
  sessions: Map<string, number | null>;
}

export async function readReceivedFeedbackGrades(
  manager: EntityManager,
  roomId: string,
  problemId: string,
  studentId: string,
): Promise<ReceivedFeedbackGrades> {
  const released = await manager.query<{ sessionId: string }[]>(
    `SELECT e.session_id AS "sessionId" FROM evaluations e
       JOIN sessions s ON s.id = e.session_id AND s.problem_id = e.problem_id
      WHERE e.problem_id = $1 AND e.student_id = $2
        AND e.type = 'TUTOR_SESSION' AND e.status = 'SUBMITTED'`,
    [problemId, studentId],
  );
  if (!released.length) return { released: false, finalScore: null, sessions: new Map() };
  return calculateReceivedGrades(manager, { roomId, problemId, studentId }, released);
}

async function calculateReceivedGrades(
  manager: EntityManager,
  context: { roomId: string; problemId: string; studentId: string },
  released: { sessionId: string }[],
): Promise<ReceivedFeedbackGrades> {
  const data = await readProblemGradeData(manager, context.roomId, context.problemId);
  const ids = new Set(released.map((row) => row.sessionId));
  data.sessions = data.sessions.filter((session) => ids.has(String(session.id)));
  data.students = data.students.filter((student) => student.id === context.studentId);
  const components = await readFormulaComponents(
    manager,
    data.formulas.map((formula) => formula.id),
  );
  const { response } = calculateProblemGrades(data, components);
  return toReceivedGrades(response.alunos[0]);
}

function toReceivedGrades(
  student: ReturnType<typeof calculateProblemGrades>['response']['alunos'][number] | undefined,
): ReceivedFeedbackGrades {
  return {
    released: true,
    finalScore: student?.notaFinal ?? null,
    sessions: new Map(student?.sessoes.map((session) => [session.sessaoId, session.nota])),
  };
}
