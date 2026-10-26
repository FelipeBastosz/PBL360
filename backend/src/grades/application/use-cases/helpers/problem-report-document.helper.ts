import {
  ReportColumnType,
  type ReportCellValue,
  type ReportColumn,
  type ReportDocument,
  type ReportFileFormat,
  type ReportSection,
  type ReportTableSection,
  type ReportTextEntry,
  type ReportTextSection,
} from '@/report-files/domain/report-document';
import type { Room } from '@/rooms/domain/entities/room.entity';
import type { Problem } from '@/problems/domain/entities/problem.entity';
import type { GradesResponseDto } from '../../dtos/grades-response.dto';
import type { ProblemFeedbackDetail } from '@/feedbacks/domain/repositories/feedback.repository';
import { FeedbackScope } from '@/feedbacks/domain/enums/feedback-scope.enum';

export interface BuildProblemReportParams {
  room: Room;
  problem: Problem;
  grades: GradesResponseDto;
  feedbacks: ProblemFeedbackDetail[];
  format: ReportFileFormat;
}

export function buildProblemReportDocument(params: BuildProblemReportParams): ReportDocument {
  const problemSuffix = params.problem.orderIndex ?? params.problem.title;
  const fileName = `relatorio-problema-${problemSuffix}-${params.room.name}`;

  return {
    format: params.format,
    title: 'Relatório do problema',
    fileName,
    repeatIdentification: true,
    identification: [
      { label: 'Turma', value: params.room.name },
      { label: 'Disciplina', value: params.room.courseCode },
      { label: 'Semestre', value: params.room.semester },
      { label: 'Problema', value: params.problem.title },
    ],
    sections: buildProblemSections(params.grades, params.feedbacks),
  };
}

function buildProblemSections(
  grades: GradesResponseDto,
  feedbacks: ProblemFeedbackDetail[],
): ReportSection[] {
  const sections: ReportSection[] = [buildGradesTableSection(grades)];
  const pendencies = buildPendenciesTableSection(grades);
  if (pendencies) sections.push(pendencies);

  sections.push(buildGeneralFeedbackSection(feedbacks));
  const sessionSection = buildSessionFeedbacksSection(feedbacks);
  if (sessionSection) sections.push(sessionSection);
  const studentSection = buildIndividualFeedbacksSection(feedbacks);
  if (studentSection) sections.push(studentSection);

  sections.push(buildNotesSection());
  return sections;
}

function buildNotesSection(): ReportTextSection {
  return {
    kind: 'text',
    title: 'Informações do relatório',
    entries: [
      {
        label: 'Critérios e notas',
        text: 'Notas das sessões consolidadas a partir das avaliações do professor e dos pesos cadastrados. A nota final pondera as notas das sessões disponíveis.',
      },
      {
        label: 'Pendências e faltas justificadas',
        text: 'Notas ausentes (— no PDF e células vazias no Excel) correspondem a sessões pendentes de avaliação ou com falta justificada. Faltas justificadas são desconsideradas no cálculo da nota final. Pendências de avaliação ativas são detalhadas na seção "Pendências de avaliação".',
      },
    ],
  };
}

function buildPendenciesTableSection(grades: GradesResponseDto): ReportTableSection | null {
  const sessionMap = new Map(
    grades.sessoes.map((s) => [s.id, s.title || s.rotulo || s.nome || 'Sessão']),
  );
  const rows = grades.alunos.flatMap((student) => extractStudentPendencies(student, sessionMap));
  if (rows.length === 0) return null;

  return {
    kind: 'table',
    title: 'Pendências de avaliação',
    columns: [
      { header: 'Aluno', type: ReportColumnType.TEXT },
      { header: 'Matrícula', type: ReportColumnType.TEXT },
      { header: 'Sessão pendente', type: ReportColumnType.TEXT },
    ],
    rows,
  };
}

function extractStudentPendencies(
  student: GradesResponseDto['alunos'][number],
  sessionMap: Map<string, string>,
): ReportCellValue[][] {
  return student.sessoes
    .filter((session) => session.situacao === 'PENDENTE')
    .map((session) => [
      student.nome,
      student.matricula ?? null,
      sessionMap.get(session.sessaoId) ?? 'Sessão',
    ]);
}

function buildGradesTableSection(grades: GradesResponseDto): ReportTableSection {
  const columns: ReportColumn[] = [
    { header: 'Aluno', type: ReportColumnType.TEXT },
    { header: 'Matrícula', type: ReportColumnType.TEXT },
    ...grades.sessoes.map((s) => ({
      header: s.title || s.rotulo || s.nome || 'Sessão',
      type: ReportColumnType.NUMBER,
      decimals: 1,
    })),
    { header: 'Nota final', type: ReportColumnType.NUMBER, decimals: 1 },
  ];

  return {
    kind: 'table',
    title: 'Notas por sessão',
    columns,
    rows: grades.alunos.map((student) => buildStudentGradeRow(student, grades.sessoes)),
  };
}

function buildStudentGradeRow(
  student: GradesResponseDto['alunos'][number],
  sessions: GradesResponseDto['sessoes'],
): ReportCellValue[] {
  const sessionMap = new Map(student.sessoes.map((s) => [s.sessaoId, s.nota]));
  const sessionGrades = sessions.map((s) => sessionMap.get(s.id) ?? null);
  return [student.nome, student.matricula ?? null, ...sessionGrades, student.notaFinal];
}

function buildGeneralFeedbackSection(feedbacks: ProblemFeedbackDetail[]): ReportTextSection {
  const general = feedbacks.find((f) => f.scope === FeedbackScope.PROBLEM);
  const label = general?.authorName ? `Turma (Autor: ${general.authorName})` : 'Turma';
  return {
    kind: 'text',
    title: 'Feedback geral do problema',
    entries: [{ label, text: general?.text ?? null }],
  };
}

function buildSessionFeedbacksSection(
  feedbacks: ProblemFeedbackDetail[],
): ReportTextSection | null {
  const sessionFeedbacks = feedbacks.filter((f) => f.scope === FeedbackScope.SESSION);
  if (sessionFeedbacks.length === 0) return null;
  return {
    kind: 'text',
    title: 'Feedbacks das sessões',
    entries: sessionFeedbacks.map(toSessionFeedbackEntry),
  };
}

function toSessionFeedbackEntry(f: ProblemFeedbackDetail): ReportTextEntry {
  const target = f.recipientName ?? 'Aluno';
  const session = f.sessionTitle ?? 'Sessão';
  const author = f.authorName ? ` (Autor: ${f.authorName})` : '';
  return { label: `${target} — ${session}${author}`, text: f.text };
}

function buildIndividualFeedbacksSection(
  feedbacks: ProblemFeedbackDetail[],
): ReportTextSection | null {
  const studentFeedbacks = feedbacks.filter((f) => f.scope === FeedbackScope.STUDENT);
  if (studentFeedbacks.length === 0) return null;
  return {
    kind: 'text',
    title: 'Feedbacks individuais',
    entries: studentFeedbacks.map(toStudentFeedbackEntry),
  };
}

function toStudentFeedbackEntry(f: ProblemFeedbackDetail): ReportTextEntry {
  const target = f.recipientName ?? 'Aluno';
  const author = f.authorName ? ` (Autor: ${f.authorName})` : '';
  return { label: `${target}${author}`, text: f.text };
}
