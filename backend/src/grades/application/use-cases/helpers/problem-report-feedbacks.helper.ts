import { FeedbackScope } from '@/feedbacks/domain/enums/feedback-scope.enum';
import type { ProblemFeedbackDetail } from '@/feedbacks/domain/repositories/feedback.repository';
import type {
  ReportSection,
  ReportTextEntry,
  ReportTextSection,
} from '@/report-files/domain/report-document';

export function buildFeedbackSections(
  feedbacks: ProblemFeedbackDetail[],
  studentMatriculaMap: Map<string, string | null>,
  ocultarNomes = false,
): ReportSection[] {
  const sections: ReportSection[] = [buildGeneralFeedbackSection(feedbacks)];
  const sessionSection = buildSessionFeedbacksSection(feedbacks, studentMatriculaMap, ocultarNomes);
  if (sessionSection) sections.push(sessionSection);
  const studentSection = buildIndividualFeedbacksSection(
    feedbacks,
    studentMatriculaMap,
    ocultarNomes,
  );
  if (studentSection) sections.push(studentSection);
  return sections;
}

function normalizeFeedbackText(text: string | null | undefined): string | null {
  return text && text.trim().length > 0 ? text : null;
}

function buildGeneralFeedbackSection(feedbacks: ProblemFeedbackDetail[]): ReportTextSection {
  const general = feedbacks.find((f) => f.scope === FeedbackScope.PROBLEM);
  const text = normalizeFeedbackText(general?.text);
  const label =
    text !== null && general?.authorName ? `Turma (Autor: ${general.authorName})` : 'Turma';
  return {
    kind: 'text',
    title: 'Feedback geral do problema',
    entries: [{ label, text }],
  };
}

function buildSessionFeedbacksSection(
  feedbacks: ProblemFeedbackDetail[],
  studentMatriculaMap: Map<string, string | null>,
  ocultarNomes = false,
): ReportTextSection | null {
  const sessionFeedbacks = feedbacks.filter(
    (f) => f.scope === FeedbackScope.SESSION && normalizeFeedbackText(f.text) !== null,
  );
  if (sessionFeedbacks.length === 0) return null;
  return {
    kind: 'text',
    title: 'Feedbacks das sessões',
    entries: sessionFeedbacks.map((f) =>
      toSessionFeedbackEntry(f, studentMatriculaMap, ocultarNomes),
    ),
  };
}

function resolveRecipient(
  f: ProblemFeedbackDetail,
  studentMatriculaMap: Map<string, string | null>,
  ocultarNomes: boolean,
): string {
  if (!ocultarNomes) return f.recipientName ?? 'Aluno';
  const matricula = f.recipientId ? studentMatriculaMap.get(f.recipientId) : null;
  return matricula ? `Matrícula: ${matricula}` : 'Aluno';
}

function toSessionFeedbackEntry(
  f: ProblemFeedbackDetail,
  studentMatriculaMap: Map<string, string | null>,
  ocultarNomes = false,
): ReportTextEntry {
  const target = resolveRecipient(f, studentMatriculaMap, ocultarNomes);
  const session = f.sessionTitle ?? 'Sessão';
  const author = f.authorName ? ` (Autor: ${f.authorName})` : '';
  return { label: `${target} — ${session}${author}`, text: f.text };
}

function buildIndividualFeedbacksSection(
  feedbacks: ProblemFeedbackDetail[],
  studentMatriculaMap: Map<string, string | null>,
  ocultarNomes = false,
): ReportTextSection | null {
  const studentFeedbacks = feedbacks.filter(
    (f) => f.scope === FeedbackScope.STUDENT && normalizeFeedbackText(f.text) !== null,
  );
  if (studentFeedbacks.length === 0) return null;
  return {
    kind: 'text',
    title: 'Feedbacks individuais',
    entries: studentFeedbacks.map((f) =>
      toStudentFeedbackEntry(f, studentMatriculaMap, ocultarNomes),
    ),
  };
}

function toStudentFeedbackEntry(
  f: ProblemFeedbackDetail,
  studentMatriculaMap: Map<string, string | null>,
  ocultarNomes = false,
): ReportTextEntry {
  const target = resolveRecipient(f, studentMatriculaMap, ocultarNomes);
  const author = f.authorName ? ` (Autor: ${f.authorName})` : '';
  return { label: `${target}${author}`, text: f.text };
}
