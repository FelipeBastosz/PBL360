import {
  ReportColumnType,
  type ReportCellValue,
  type ReportColumn,
  type ReportDocument,
  type ReportFileFormat,
  type ReportSection,
  type ReportTableSection,
  type ReportTextSection,
} from '@/report-files/domain/report-document';
import type { Room } from '@/rooms/domain/entities/room.entity';
import type { Problem } from '@/problems/domain/entities/problem.entity';
import type { GradesResponseDto } from '../../dtos/grades-response.dto';
import type { ProblemFeedbackDetail } from '@/feedbacks/domain/repositories/feedback.repository';
import { buildFeedbackSections } from './problem-report-feedbacks.helper';

export interface BuildProblemReportParams {
  room: Room;
  problem: Problem;
  grades: GradesResponseDto;
  feedbacks: ProblemFeedbackDetail[];
  format: ReportFileFormat;
  ocultarNomes?: boolean;
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
    sections: buildProblemSections(params.grades, params.feedbacks, params.ocultarNomes ?? false),
  };
}

function buildProblemSections(
  grades: GradesResponseDto,
  feedbacks: ProblemFeedbackDetail[],
  ocultarNomes = false,
): ReportSection[] {
  const studentMatriculaMap = new Map(grades.alunos.map((a) => [a.alunoId, a.matricula]));
  const sections: ReportSection[] = [buildGradesTableSection(grades, ocultarNomes)];
  const pendencies = buildPendenciesTableSection(grades, ocultarNomes);
  if (pendencies) sections.push(pendencies);

  sections.push(...buildFeedbackSections(feedbacks, studentMatriculaMap, ocultarNomes));
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

const pendencyColumns = (ocultarNomes: boolean): ReportColumn[] =>
  ocultarNomes
    ? [
        { header: 'Matrícula', type: ReportColumnType.TEXT },
        { header: 'Sessão pendente', type: ReportColumnType.TEXT },
      ]
    : [
        { header: 'Aluno', type: ReportColumnType.TEXT },
        { header: 'Matrícula', type: ReportColumnType.TEXT },
        { header: 'Sessão pendente', type: ReportColumnType.TEXT },
      ];

function buildPendenciesTableSection(
  grades: GradesResponseDto,
  ocultarNomes = false,
): ReportTableSection | null {
  const sessionMap = new Map(
    grades.sessoes.map((s) => [s.id, s.title || s.rotulo || s.nome || 'Sessão']),
  );
  const rows = grades.alunos.flatMap((student) =>
    extractStudentPendencies(student, sessionMap, ocultarNomes),
  );
  if (rows.length === 0) return null;

  return {
    kind: 'table',
    title: 'Pendências de avaliação',
    columns: pendencyColumns(ocultarNomes),
    rows,
  };
}

function extractStudentPendencies(
  student: GradesResponseDto['alunos'][number],
  sessionMap: Map<string, string>,
  ocultarNomes = false,
): ReportCellValue[][] {
  return student.sessoes
    .filter((session) => session.situacao === 'PENDENTE')
    .map((session) => {
      const sessionTitle = sessionMap.get(session.sessaoId) ?? 'Sessão';
      if (ocultarNomes) {
        return [student.matricula ?? null, sessionTitle];
      }
      return [student.nome, student.matricula ?? null, sessionTitle];
    });
}

const gradesColumns = (
  sessions: GradesResponseDto['sessoes'],
  ocultarNomes: boolean,
): ReportColumn[] => [
  ...(ocultarNomes
    ? [{ header: 'Matrícula', type: ReportColumnType.TEXT }]
    : [
        { header: 'Aluno', type: ReportColumnType.TEXT },
        { header: 'Matrícula', type: ReportColumnType.TEXT },
      ]),
  ...sessions.map((s) => ({
    header: s.title || s.rotulo || s.nome || 'Sessão',
    type: ReportColumnType.NUMBER,
    decimals: 1,
  })),
  { header: 'Nota final', type: ReportColumnType.NUMBER, decimals: 1 },
];

function buildGradesTableSection(
  grades: GradesResponseDto,
  ocultarNomes = false,
): ReportTableSection {
  return {
    kind: 'table',
    title: 'Notas por sessão',
    columns: gradesColumns(grades.sessoes, ocultarNomes),
    rows: grades.alunos.map((student) =>
      buildStudentGradeRow(student, grades.sessoes, ocultarNomes),
    ),
  };
}

function buildStudentGradeRow(
  student: GradesResponseDto['alunos'][number],
  sessions: GradesResponseDto['sessoes'],
  ocultarNomes = false,
): ReportCellValue[] {
  const sessionMap = new Map(student.sessoes.map((s) => [s.sessaoId, s.nota]));
  const sessionGrades = sessions.map((s) => sessionMap.get(s.id) ?? null);
  if (ocultarNomes) {
    return [student.matricula ?? null, ...sessionGrades, student.notaFinal];
  }
  return [student.nome, student.matricula ?? null, ...sessionGrades, student.notaFinal];
}
