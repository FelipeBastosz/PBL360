import type { ReportTextEntry } from '@/report-files/domain/report-document';
import type {
  SessionReportData,
  SessionReportStudentData,
} from '../../../domain/repositories/session-report.repository';

export function buildFeedbackEntries(
  data: SessionReportData,
  ocultarNome = false,
): ReportTextEntry[] {
  const entries: ReportTextEntry[] = [];
  if (data.generalFeedback) {
    entries.push({
      label: `Geral (Autor: ${data.generalFeedback.authorName})`,
      text: data.generalFeedback.text,
    });
  }
  for (const student of data.students) {
    const fb = student.feedback;
    entries.push({
      label: feedbackStudentLabel(student, fb?.authorName, ocultarNome),
      text: fb?.text ?? null,
    });
  }
  return entries;
}

function feedbackStudentLabel(
  student: SessionReportStudentData,
  authorName: string | undefined,
  ocultarNome: boolean,
): string {
  const studentLabel = ocultarNome ? (student.matricula ?? 'Aluno') : student.name;
  return authorName ? `${studentLabel} (Autor: ${authorName})` : studentLabel;
}
