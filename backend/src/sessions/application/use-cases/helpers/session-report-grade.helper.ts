import { EvaluationStatus } from '@/evaluations/domain/enums/evaluation-status.enum';
import { SessionGradeCalculator } from '@/evaluations/domain/services/session-grade-calculator';
import type {
  SessionReportData,
  SessionReportStudentData,
} from '../../../domain/repositories/session-report.repository';

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
