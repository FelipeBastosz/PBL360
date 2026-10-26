import {
  ReportColumnType,
  ReportFileFormat,
  type ReportCellValue,
  type ReportColumn,
  type ReportDocument,
  type ReportTableSection,
  type ReportTextSection,
} from '../domain/report-document';

const text = (header: string): ReportColumn => ({ header, type: ReportColumnType.TEXT });
const grade = (header: string): ReportColumn => ({ header, type: ReportColumnType.NUMBER });

export const LONG_STUDENT_NAME =
  'Maria Eduarda Albuquerque de Vasconcelos Cavalcanti Figueiredo dos Santos Nogueira';

export const LONG_FEEDBACK = Array.from(
  { length: 40 },
  (_, index) =>
    `Parágrafo ${index + 1}: o grupo discutiu as hipóteses com profundidade, trouxe fontes ` +
    'confiáveis e conectou os objetivos de aprendizagem ao caso clínico apresentado.',
).join('\n');

export const buildReportDocument = (overrides: Partial<ReportDocument> = {}): ReportDocument => ({
  format: ReportFileFormat.PDF,
  title: 'Relatório',
  fileName: 'relatorio',
  identification: [],
  sections: [],
  ...overrides,
});

const ROOM = { label: 'Sala', value: 'Turma A — Medicina 2026.2' };
const PROBLEM = { label: 'Problema', value: 'Problema 1 — Dor torácica' };

const SESSION_GRADES: ReportTableSection = {
  kind: 'table',
  title: 'Notas da sessão',
  columns: [
    text('Aluno'),
    text('Matrícula'),
    grade('Tutor'),
    grade('Autoavaliação'),
    grade('Pares'),
    grade('Nota'),
  ],
  rows: [
    ['Ana Souza', '00123', 8.5, 9, 8.75, 8.62],
    [LONG_STUDENT_NAME, '04567', 7, null, 6.5, null],
    ['=SOMA(1;1)', '000089', null, null, null, null],
  ],
};

const SESSION_FEEDBACKS: ReportTextSection = {
  kind: 'text',
  title: 'Feedbacks da sessão',
  entries: [
    { label: 'Ana Souza', text: 'Boa condução da discussão.' },
    { label: LONG_STUDENT_NAME, text: LONG_FEEDBACK },
    { label: '=SOMA(1;1)', text: null },
  ],
};

const PROBLEM_GRADES: ReportTableSection = {
  kind: 'table',
  title: 'Notas por sessão',
  columns: [
    text('Aluno'),
    text('Matrícula'),
    grade('Abertura'),
    grade('Sessão 2'),
    grade('Sessão 3'),
    grade('Fechamento'),
    grade('Nota final'),
  ],
  rows: [
    ['Ana Souza', '00123', 8.5, 9, 7.25, 10, 8.69],
    [LONG_STUDENT_NAME, '04567', 7, null, 6.5, 8, null],
  ],
};

const PROBLEM_FEEDBACK: ReportTextSection = {
  kind: 'text',
  title: 'Feedback geral do problema',
  entries: [{ label: 'Turma', text: 'A turma evoluiu na construção das hipóteses.' }],
};

const CLASS_COLUMNS: ReportColumn[] = [
  text('Aluno'),
  text('Matrícula'),
  grade('Problema 1'),
  grade('Problema 2'),
  grade('Média final'),
  { header: 'Faltas', type: ReportColumnType.NUMBER, decimals: 0 },
];

const classRow = (index: number): ReportCellValue[] => [
  `Aluno ${String(index + 1).padStart(3, '0')}`,
  String(index + 1).padStart(6, '0'),
  index % 7 === 0 ? null : 6 + (index % 5),
  7.5,
  index % 7 === 0 ? null : 7.25,
  index % 3,
];

export const sessionReportDocument = (format: ReportFileFormat): ReportDocument =>
  buildReportDocument({
    format,
    title: 'Relatório da sessão',
    fileName: 'relatório-sessão-abertura',
    identification: [ROOM, PROBLEM, { label: 'Sessão', value: 'Abertura (14/10/2026)' }],
    sections: [SESSION_GRADES, SESSION_FEEDBACKS],
  });

export const problemReportDocument = (format: ReportFileFormat): ReportDocument =>
  buildReportDocument({
    format,
    title: 'Relatório do problema',
    fileName: 'relatorio-problema-1',
    identification: [ROOM, PROBLEM],
    sections: [PROBLEM_GRADES, PROBLEM_FEEDBACK],
  });

export const classReportDocument = (format: ReportFileFormat, studentCount = 60): ReportDocument =>
  buildReportDocument({
    format,
    title: 'Relatório final da turma',
    fileName: 'relatorio-final-turma-a',
    identification: [ROOM],
    sections: [
      {
        kind: 'table',
        title: 'Notas finais',
        columns: CLASS_COLUMNS,
        rows: Array.from({ length: studentCount }, (_, index) => classRow(index)),
      },
    ],
  });
