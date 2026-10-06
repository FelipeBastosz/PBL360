import { presentGrade, type GradeComponent } from '../../../domain/entities/grade-calculator';
import type { GradesResponseDto } from '../../dtos/grades-response.dto';
import type { Row, StudentResponse } from './get-problem-grades.helper';

export function buildGradeResponse(
  sessions: Row[],
  students: StudentResponse[],
  sessionFormula?: Row,
  problemFormula?: Row,
): GradesResponseDto {
  return {
    sessoes: sessions.map((session, index) => ({
      id: String(session.id),
      rotulo: `S${index + 1}`,
      data: String(session.date),
    })),
    alunos: students,
    mediaTurma: presentGrade(classAverage(students.map((student) => student.notaFinal))),
    versoesFormula: {
      sessao: sessionFormula ? Number(sessionFormula.version) : null,
      problema: problemFormula ? Number(problemFormula.version) : null,
    },
  };
}

export function selectComponents(rows: Row[], formula?: Row): GradeComponent[] {
  return rows
    .filter((row) => row.formula_id === formula?.id)
    .map((row) => ({
      type: row.type as GradeComponent['type'],
      referenceId: row.reference_id as string | null,
      weight: Number(row.weight),
    }));
}

function classAverage(grades: Array<number | null>): number | null {
  const available = grades.filter((grade): grade is number => grade !== null);
  return available.length === 0
    ? null
    : available.reduce((sum, grade) => sum + grade, 0) / available.length;
}
