import { presentGrade, type GradeComponent } from '../../../domain/entities/grade-calculator';
import type { GradesResponseDto } from '../../dtos/grades-response.dto';
import type { Row, StudentResponse, StudentSessionResponse } from './get-problem-grades.helper';

export function buildGradeResponse(
  sessions: Row[],
  students: StudentResponse[],
  sessionFormula?: Row,
  problemFormula?: Row,
): GradesResponseDto {
  return {
    sessoes: sessionResponses(sessions),
    alunos: students,
    mediaTurma: presentGrade(classAverage(students.map((student) => student.notaFinal))),
    versoesFormula: formulaVersions(sessionFormula, problemFormula),
  };
}

export function buildStudentResponse(
  student: Row,
  grades: StudentSessionResponse[],
  finalGrade: number | null,
): StudentResponse {
  return {
    alunoId: String(student.id),
    nome: String(student.name),
    matricula: student.matricula as string | null,
    sessoes: grades,
    notaFinal: presentGrade(finalGrade),
  };
}

function sessionResponses(sessions: Row[]) {
  return sessions.map((session, index) => {
    const rawTitle = (session.title as string | null | undefined)?.trim();
    const title = rawTitle || `S${index + 1}`;
    return {
      id: String(session.id),
      nome: title,
      title,
      rotulo: title,
      data: String(session.date),
    };
  });
}

function formulaVersions(sessionFormula?: Row, problemFormula?: Row) {
  return {
    sessao:
      sessionFormula?.version === null || sessionFormula?.version === undefined
        ? null
        : Number(sessionFormula.version),
    problema: problemFormula ? Number(problemFormula.version) : null,
  };
}

export function selectComponents(rows: Row[], formula?: Row): GradeComponent[] {
  return rows
    .filter((row) => row.formula_id === formula?.id)
    .map((row) => ({
      type: row.type as GradeComponent['type'],
      referenceId: row.reference_id as string | null,
      weight: Number(row.weight),
      sessionId: row.session_id ? String(row.session_id) : undefined,
    }));
}

function classAverage(grades: Array<number | null>): number | null {
  const available = grades.filter((grade): grade is number => grade !== null);
  return available.length === 0
    ? null
    : available.reduce((sum, grade) => sum + grade, 0) / available.length;
}
