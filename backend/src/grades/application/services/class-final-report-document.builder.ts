import {
  ReportColumnType,
  ReportFileFormat,
  type ReportCellValue,
  type ReportColumn,
  type ReportDocument,
  type ReportSection,
  type ReportTableSection,
} from '@/report-files/domain/report-document';
import type {
  ClassFinalReportResponseDto,
  ClassReportProblemDto,
  ClassReportStudentDto,
} from '../dtos/class-final-report-response.dto';

export const PDF_PROBLEMS_PER_SECTION = 3;

const textColumn = (header: string): ReportColumn => ({ header, type: ReportColumnType.TEXT });
const gradeColumn = (header: string): ReportColumn => ({
  header,
  type: ReportColumnType.NUMBER,
  decimals: 1,
});

const studentStatus = (student: ClassReportStudentDto): string => {
  if (student.mediaGeral === null) return 'Pendente';
  return student.isParcial ? 'Parcial' : 'Completa';
};

const columnsFor = (problems: ClassReportProblemDto[]): ReportColumn[] => [
  { ...textColumn('Aluno'), pdfWidth: '*' },
  textColumn('Matrícula'),
  ...problems.map((problem): ReportColumn => ({
    ...gradeColumn(`P${problem.ordem} — ${problem.titulo}`),
    pdfWidth: '*',
  })),
  gradeColumn('Média geral'),
  textColumn('Situação'),
];

const studentRow = (
  student: ClassReportStudentDto,
  problems: ClassReportProblemDto[],
): ReportCellValue[] => {
  const grades = new Map(student.notasProblemas.map((item) => [item.problemaId, item.notaFinal]));
  return [
    student.nome,
    student.matricula,
    ...problems.map((problem) => grades.get(problem.id) ?? null),
    student.mediaGeral,
    studentStatus(student),
  ];
};

const gradesSection = (
  report: ClassFinalReportResponseDto,
  problems: ClassReportProblemDto[],
  title: string,
): ReportTableSection => ({
  kind: 'table',
  title,
  columns: columnsFor(problems),
  rows: report.alunos.map((student) => studentRow(student, problems)),
  keepRowsTogether: true,
});

const pdfSections = (report: ClassFinalReportResponseDto): ReportTableSection[] => {
  const sections: ReportTableSection[] = [];
  for (let index = 0; index < report.problemas.length; index += PDF_PROBLEMS_PER_SECTION) {
    const problems = report.problemas.slice(index, index + PDF_PROBLEMS_PER_SECTION);
    const title = `Notas por problema — bloco ${sections.length + 1}`;
    sections.push({ ...gradesSection(report, problems, title), startOnNewPage: index > 0 });
  }
  return sections;
};

const dataSections = (
  report: ClassFinalReportResponseDto,
  format: ReportFileFormat,
): ReportSection[] => {
  if (report.alunos.length === 0) return [];
  if (format === ReportFileFormat.XLSX || report.problemas.length === 0) {
    return [gradesSection(report, report.problemas, 'Notas finais')];
  }
  return pdfSections(report);
};

const notesSection = (report: ClassFinalReportResponseDto): ReportSection => {
  const entries = [];
  if (report.alunos.length === 0)
    entries.push({ label: 'Alunos', text: 'Nenhum aluno vinculado à turma.' });
  if (report.problemas.length === 0)
    entries.push({ label: 'Problemas', text: 'Nenhum problema cadastrado na turma.' });
  entries.push(
    {
      label: 'Situação',
      text: 'Completa: todas as notas disponíveis. Parcial: faltam notas. Pendente: nenhuma nota disponível.',
    },
    {
      label: 'Média e pendências',
      text: 'Média simples das notas finais disponíveis. Notas ausentes: — no PDF e células vazias no Excel.',
    },
  );
  return { kind: 'text', title: 'Informações do relatório', entries };
};

export const buildClassFinalReportDocument = (
  report: ClassFinalReportResponseDto,
  format: ReportFileFormat,
): ReportDocument => ({
  format,
  title: 'Relatório final da turma',
  fileName: `relatorio-final-${report.sala.nome}`,
  identification: [
    { label: 'Turma', value: report.sala.nome },
    { label: 'Disciplina', value: report.sala.codigoDisciplina },
    { label: 'Semestre', value: report.sala.semestre },
  ],
  sections: [...dataSections(report, format), notesSection(report)],
});
