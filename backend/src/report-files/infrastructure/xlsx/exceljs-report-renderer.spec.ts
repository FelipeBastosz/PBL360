import { Workbook, type Worksheet } from 'exceljs';
import {
  ReportColumnType,
  ReportFileFormat,
  type ReportDocument,
} from '../../domain/report-document';
import {
  LONG_FEEDBACK,
  LONG_STUDENT_NAME,
  buildReportDocument,
  classReportDocument,
  problemReportDocument,
  sessionReportDocument,
} from '../../testing/report-document-fixtures';
import {
  EMPTY_DOCUMENT_MESSAGE,
  EMPTY_TABLE_MESSAGE,
  EMPTY_TEXT_SECTION_MESSAGE,
  MISSING_TEXT_LABEL,
} from '../report-cell';
import { MAX_EXCEL_TEXT_LENGTH } from './xlsx-sheet-layout';
import { ExceljsReportRenderer } from './exceljs-report-renderer';

const renderer = new ExceljsReportRenderer();

const renderWorkbook = async (document: ReportDocument): Promise<Workbook> => {
  const workbook = new Workbook();
  const buffer = await renderer.render(document);
  await workbook.xlsx.load(buffer as unknown as Parameters<typeof workbook.xlsx.load>[0]);
  return workbook;
};

const sheetOf = (workbook: Workbook, name: string): Worksheet => {
  const sheet = workbook.getWorksheet(name);
  if (!sheet) throw new Error(`Missing sheet ${name}`);
  return sheet;
};

const rowValues = (sheet: Worksheet, rowNumber: number): unknown[] => {
  const values = sheet.getRow(rowNumber).values;
  return Array.isArray(values) ? values.slice(1) : [];
};

const headerRowNumber = (sheet: Worksheet, firstHeader: string): number => {
  let found = -1;
  sheet.eachRow((row, rowNumber) => {
    if (found === -1 && row.getCell(1).value === firstHeader) found = rowNumber;
  });
  return found;
};

describe('ExceljsReportRenderer', () => {
  describe('session report', () => {
    let workbook: Workbook;
    let grades: Worksheet;

    beforeAll(async () => {
      workbook = await renderWorkbook(sessionReportDocument(ReportFileFormat.XLSX));
      grades = sheetOf(workbook, 'Notas da sessão');
    });

    it('creates one sheet per section', () => {
      expect(workbook.worksheets.map((sheet) => sheet.name)).toEqual([
        'Notas da sessão',
        'Feedbacks da sessão',
      ]);
    });

    it('opens every sheet with the title, the section and the identification', () => {
      expect(rowValues(grades, 1)).toEqual(['Relatório da sessão']);
      expect(rowValues(grades, 2)).toEqual(['Notas da sessão']);
      expect(rowValues(grades, 3)).toEqual(['Sala', 'Turma A — Medicina 2026.2']);
      expect(rowValues(grades, 5)).toEqual(['Sessão', 'Abertura (14/10/2026)']);
    });

    it('freezes and filters the header row', () => {
      const header = headerRowNumber(grades, 'Aluno');

      expect(rowValues(grades, header)).toEqual([
        'Aluno',
        'Matrícula',
        'Tutor',
        'Autoavaliação',
        'Pares',
        'Nota',
      ]);
      expect(grades.views[0]).toMatchObject({ state: 'frozen', ySplit: header });
      expect(grades.autoFilter).toBe(`A${header}:F${header}`);
    });

    it('keeps grades as numbers and registrations as text with leading zeros', () => {
      const first = grades.getRow(headerRowNumber(grades, 'Aluno') + 1);

      expect(first.getCell(2).value).toBe('00123');
      expect(first.getCell(2).numFmt).toBe('@');
      expect(first.getCell(3).value).toBe(8.5);
      expect(first.getCell(6).value).toBe(8.62);
      expect(first.getCell(6).numFmt).toBe('0.0');
    });

    it('leaves missing grades empty instead of writing zero', () => {
      const second = grades.getRow(headerRowNumber(grades, 'Aluno') + 2);

      expect(second.getCell(1).value).toBe(LONG_STUDENT_NAME);
      expect(second.getCell(4).value).toBeNull();
      expect(second.getCell(6).value).toBeNull();
    });

    it('keeps text typed by users as text, never as a formula', () => {
      const cell = grades.getRow(headerRowNumber(grades, 'Aluno') + 3).getCell(1);

      expect(cell.value).toBe('=SOMA(1;1)');
      expect(cell.formula).toBeUndefined();
    });

    it('writes feedbacks as wrapped text and marks the missing ones', () => {
      const feedbacks = sheetOf(workbook, 'Feedbacks da sessão');
      const header = headerRowNumber(feedbacks, 'Item');

      expect(rowValues(feedbacks, header + 1)).toEqual(['Ana Souza', 'Boa condução da discussão.']);
      expect(feedbacks.getRow(header + 2).getCell(2).value).toBe(LONG_FEEDBACK);
      expect(feedbacks.getRow(header + 2).getCell(2).alignment).toMatchObject({ wrapText: true });
      expect(feedbacks.getRow(header + 3).getCell(2).value).toBe(MISSING_TEXT_LABEL);
    });
  });

  it('renders the problem report with every session as a numeric column', async () => {
    const workbook = await renderWorkbook(problemReportDocument(ReportFileFormat.XLSX));
    const grades = sheetOf(workbook, 'Notas por sessão');
    const header = headerRowNumber(grades, 'Aluno');

    expect(rowValues(grades, header + 1)).toEqual(['Ana Souza', '00123', 8.5, 9, 7.25, 10, 8.69]);
    expect(sheetOf(workbook, 'Feedback geral do problema')).toBeDefined();
  });

  it('renders every student of a large class with the declared decimals', async () => {
    const workbook = await renderWorkbook(classReportDocument(ReportFileFormat.XLSX, 2000));
    const grades = sheetOf(workbook, 'Notas finais');
    const header = headerRowNumber(grades, 'Aluno');
    const last = grades.getRow(header + 2000);

    expect(grades.rowCount).toBe(header + 2000);
    expect(last.getCell(1).value).toBe('Aluno 2000');
    expect(last.getCell(2).value).toBe('002000');
    expect(last.getCell(6).value).toBe(1999 % 3);
    expect(last.getCell(6).numFmt).toBe('0');
  });

  it('sizes columns by the formatted value and writes numeric text as numbers', async () => {
    const workbook = await renderWorkbook(
      buildReportDocument({
        sections: [
          {
            kind: 'table',
            title: 'Notas',
            columns: [
              { header: 'Índice', type: ReportColumnType.NUMBER, decimals: 6 },
              { header: 'Nota', type: ReportColumnType.NUMBER },
            ],
            rows: [[123456.5, '8,5']],
          },
        ],
      }),
    );
    const grades = sheetOf(workbook, 'Notas');
    const header = headerRowNumber(grades, 'Índice');

    expect(grades.getColumn(1).width).toBe('123.456,500000'.length + 2);
    expect(grades.getRow(header + 1).getCell(2).value).toBe(8.5);
  });

  it('explains empty sections instead of leaving blank sheets', async () => {
    const workbook = await renderWorkbook(
      buildReportDocument({
        sections: [
          {
            kind: 'table',
            title: 'Notas',
            columns: [{ header: 'Aluno', type: ReportColumnType.TEXT }],
            rows: [],
          },
          { kind: 'text', title: 'Feedbacks', entries: [] },
        ],
      }),
    );
    const grades = sheetOf(workbook, 'Notas');
    const feedbacks = sheetOf(workbook, 'Feedbacks');

    expect(grades.getRow(headerRowNumber(grades, 'Aluno') + 1).getCell(1).value).toBe(
      EMPTY_TABLE_MESSAGE,
    );
    expect(grades.autoFilter).toBeUndefined();
    expect(feedbacks.getRow(headerRowNumber(feedbacks, 'Item') + 1).getCell(1).value).toBe(
      EMPTY_TEXT_SECTION_MESSAGE,
    );
  });

  it('still produces a readable workbook when there are no sections', async () => {
    const workbook = await renderWorkbook(buildReportDocument({ title: 'Relatório vazio' }));

    expect(workbook.worksheets).toHaveLength(1);
    expect(rowValues(workbook.worksheets[0]!, 1)).toEqual(['Relatório vazio']);
    expect(rowValues(workbook.worksheets[0]!, 3)).toEqual([EMPTY_DOCUMENT_MESSAGE]);
  });

  it('cuts text at the Excel cell limit so the file stays valid', async () => {
    const workbook = await renderWorkbook(
      buildReportDocument({
        sections: [
          {
            kind: 'text',
            title: 'Feedbacks',
            entries: [{ label: 'Ana', text: 'a'.repeat(40000) }],
          },
        ],
      }),
    );
    const feedbacks = sheetOf(workbook, 'Feedbacks');
    const text = feedbacks.getRow(headerRowNumber(feedbacks, 'Item') + 1).getCell(2).value;

    expect(text).toHaveLength(MAX_EXCEL_TEXT_LENGTH);
  });
});
