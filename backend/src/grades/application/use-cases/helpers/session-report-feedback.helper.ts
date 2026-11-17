import type { ReportTextEntry } from '@/report-files/domain/report-document';
import type {
  SessionReportData,
  SessionReportStudentData,
} from '@/sessions/domain/repositories/session-report.repository';

function normalizeFeedbackText(text: string | null | undefined): string | null {
  return text && text.trim().length > 0 ? text : null;
}

export function buildFeedbackEntries(
  data: SessionReportData,
  ocultarNome = false,
): ReportTextEntry[] {
  const entries: ReportTextEntry[] = [];
  const generalText = normalizeFeedbackText(data.generalFeedback?.text);
  if (data.generalFeedback && generalText !== null) {
    entries.push({
      label: `Geral (Autor: ${data.generalFeedback.authorName})`,
      text: generalText,
    });
  }
  for (const student of data.students) {
    entries.push(buildStudentFeedbackEntry(student, ocultarNome));
  }
  return entries;
}

function buildStudentFeedbackEntry(
  student: SessionReportStudentData,
  ocultarNome: boolean,
): ReportTextEntry {
  const text = normalizeFeedbackText(student.feedback?.text);
  const authorName = text !== null ? student.feedback?.authorName : undefined;
  return {
    label: feedbackStudentLabel(student, authorName, ocultarNome),
    text,
  };
}

function feedbackStudentLabel(
  student: SessionReportStudentData,
  authorName: string | undefined,
  ocultarNome: boolean,
): string {
  const studentLabel = ocultarNome ? (student.matricula ?? 'Aluno') : student.name;
  return authorName ? `${studentLabel} (Autor: ${authorName})` : studentLabel;
}
