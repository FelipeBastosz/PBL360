import { EvaluationStatus } from '@/evaluations/domain/enums/evaluation-status.enum';
import { roundGrade } from '@/shared/utils/grade-precision';
import type { GradesResponseDto } from '../../dtos/grades-response.dto';
import type { ProblemGradesWithSessionGrades } from './get-problem-grades.helper';

type StudentSessionGrade = GradesResponseDto['alunos'][number]['sessoes'][number];

interface SessionReportGradeEntry {
  session: StudentSessionGrade;
  exactGrade: number | null;
}

export type SessionReportGrades = Map<string, SessionReportGradeEntry>;

export interface SessionReportGrade {
  gradeStatus: string;
  grade: number | null;
}

const ABSENCE_LABELS: Record<string, string> = {
  AUSENTE: 'Ausente',
  JUSTIFICADA: 'Falta justificada',
};

function exactGradeOf(
  sessionGrades: ProblemGradesWithSessionGrades['sessionGrades'],
  sessionId: string,
  studentId: string,
): number | null {
  const row = sessionGrades.find(
    (item) => item.session_id === sessionId && item.student_id === studentId,
  );
  return row?.grade === null || row?.grade === undefined ? null : Number(row.grade);
}

export function collectSessionGrades(
  { response, sessionGrades }: ProblemGradesWithSessionGrades,
  sessionId: string,
): SessionReportGrades {
  const entries = response.alunos.flatMap((aluno) => {
    const session = aluno.sessoes.find((item) => item.sessaoId === sessionId);
    if (!session) return [];
    const exactGrade = exactGradeOf(sessionGrades, sessionId, aluno.alunoId);
    return [[aluno.alunoId, { session, exactGrade }] as const];
  });
  return new Map(entries);
}

const isPlanningPoker = (session: StudentSessionGrade): boolean =>
  session.modalidade === 'PARES' && session.pares.origem === 'PLANNING_POKER';

function reportedGrade({ session, exactGrade }: SessionReportGradeEntry): number | null {
  if (isPlanningPoker(session) || exactGrade === null) return session.nota;
  return roundGrade(exactGrade);
}

function pendingLabel(
  session: StudentSessionGrade | undefined,
  evaluationStatus: EvaluationStatus | null,
): string {
  const isTutorDraft =
    (!session || session.modalidade === 'TUTOR') && evaluationStatus === EvaluationStatus.DRAFT;
  return isTutorDraft ? 'Rascunho' : 'Não registrada';
}

export function toSessionReportGrade(
  entry: SessionReportGradeEntry | undefined,
  evaluationStatus: EvaluationStatus | null,
): SessionReportGrade {
  const session = entry?.session;
  if (entry && session?.situacao === 'AVALIADA') {
    return { gradeStatus: 'Nota enviada', grade: reportedGrade(entry) };
  }
  const absence = session ? ABSENCE_LABELS[session.situacao] : undefined;
  if (entry && absence) return { gradeStatus: absence, grade: reportedGrade(entry) };
  return { gradeStatus: pendingLabel(session, evaluationStatus), grade: null };
}
