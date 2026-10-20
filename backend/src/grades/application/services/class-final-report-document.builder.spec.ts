import { Workbook } from 'exceljs';
import {
  ReportColumnType,
  ReportFileFormat,
  type ReportTableSection,
  type ReportTextSection,
} from '@/report-files/domain/report-document';
import { buildPdfDefinition } from '@/report-files/infrastructure/pdf/pdf-document-definition';
import { ExceljsReportRenderer } from '@/report-files/infrastructure/xlsx/exceljs-report-renderer';
import { buildClassFinalReportFixture } from '../../testing/class-final-report.fixture';
import { buildClassFinalReportDocument } from './class-final-report-document.builder';

const logo = '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"></svg>';

describe('buildClassFinalReportDocument', () => {
  it.each([ReportFileFormat.PDF, ReportFileFormat.XLSX])(
    'preserves the consolidation in %s',
    (format) => {
      const report = buildClassFinalReportFixture();
      const original = structuredClone(report);
      const document = buildClassFinalReportDocument(report, format);
      const table = document.sections[0] as ReportTableSection;

      expect(document.identification).toEqual([
        { label: 'Turma', value: 'Turma A' },
        { label: 'Disciplina', value: 'MED101' },
        { label: 'Semestre', value: '2026.2' },
      ]);
      expect(table.rows).toEqual([
        ['Ana Souza', '00000001', 8, 0, null, 4, 'Parcial'],
        ['Bruno Lima', null, null, null, null, null, 'Pendente'],
        ['Carla Santos', '00000003', 8.3, 6.8, 8, 7.7, 'Completa'],
      ]);
      expect(table.columns[1]?.type).toBe(ReportColumnType.TEXT);
      expect(table.columns[2]).toMatchObject({ type: ReportColumnType.NUMBER, decimals: 1 });
      expect(report).toEqual(original);
    },
  );

  it('splits many problems without losing or recalculating grades', () => {
    const report = buildClassFinalReportFixture();
    report.problemas = Array.from({ length: 20 }, (_, i) => ({
      id: `p-${i}`,
      titulo: `Problema ${i}`,
      ordem: i + 1,
    }));
    report.alunos[0]!.notasProblemas = report.problemas.map((problem, i) => ({
      problemaId: problem.id,
      notaFinal: i % 11,
    }));
    const pdf = buildClassFinalReportDocument(report, ReportFileFormat.PDF);
    const tables = pdf.sections.filter(
      (section): section is ReportTableSection => section.kind === 'table',
    );

    expect(tables).toHaveLength(7);
    expect(tables.map((table) => table.startOnNewPage)).toEqual([
      false,
      true,
      true,
      true,
      true,
      true,
      true,
    ]);
    const content = buildPdfDefinition(pdf, logo).content as Array<{ pageBreak?: string }>;
    expect(content.filter((item) => item.pageBreak === 'before')).toHaveLength(6);
    expect(tables.flatMap((table) => table.rows[0]!.slice(2, -2))).toEqual(
      Array.from({ length: 20 }, (_, i) => i % 11),
    );
    for (const table of tables) {
      expect(table.columns.length).toBeLessThanOrEqual(7);
      expect(table.rows[0]?.slice(0, 2)).toEqual(['Ana Souza', '00000001']);
      expect(table.rows[0]?.slice(-2)).toEqual([4, 'Parcial']);
    }
    const excel = buildClassFinalReportDocument(report, ReportFileFormat.XLSX);
    expect((excel.sections[0] as ReportTableSection).columns).toHaveLength(24);
  });

  it('repeats PDF headers, keeps each student on one page and uses the grade display precision', () => {
    const definition = buildPdfDefinition(
      buildClassFinalReportDocument(buildClassFinalReportFixture(), ReportFileFormat.PDF),
      logo,
    );
    const content = definition.content as Array<{
      table?: { headerRows: number; dontBreakRows: boolean; body: Array<Array<{ text: string }>> };
    }>;
    const table = content.find((item) => item.table)?.table;

    expect(table).toMatchObject({
      headerRows: 1,
      dontBreakRows: true,
      widths: ['*', 'auto', '*', '*', '*', 'auto', 'auto'],
    });
    expect(table?.body[0]?.map((cell) => cell.text)).toEqual([
      'Aluno',
      'Matrícula',
      'P1 — Dor torácica',
      'P2 — Dispneia',
      'P3 — Cefaleia',
      'Média geral',
      'Situação',
    ]);
    expect(table?.body[1]?.map((cell) => cell.text)).toEqual([
      'Ana Souza',
      '00000001',
      '8,0',
      '0,0',
      '—',
      '4,0',
      'Parcial',
    ]);
    expect(table?.body[3]?.map((cell) => cell.text)).toContain('7,7');
  });

  it('generates readable Excel cells with numeric grades and textual registrations', async () => {
    const document = buildClassFinalReportDocument(
      buildClassFinalReportFixture(),
      ReportFileFormat.XLSX,
    );
    const workbook = new Workbook();
    const content = await new ExceljsReportRenderer().render(document);
    await workbook.xlsx.load(Uint8Array.from(content).buffer);
    const sheet = workbook.getWorksheet('Notas finais')!;
    let studentRow = 0;
    sheet.eachRow((row, index) => {
      if (row.getCell(1).value === 'Ana Souza') studentRow = index;
    });
    expect(studentRow).toBeGreaterThan(0);
    const row = sheet.getRow(studentRow);
    expect(row.getCell(2).value).toBe('00000001');
    expect(row.getCell(2).numFmt).toBe('@');
    expect(row.getCell(3).value).toBe(8);
    expect(row.getCell(4).value).toBe(0);
    expect(row.getCell(5).value).toBeNull();
    expect(row.getCell(6).value).toBe(4);
    expect(row.getCell(6).numFmt).toBe('0.0');
    expect(row.getCell(7).value).toBe('Parcial');
  });

  it.each([ReportFileFormat.PDF, ReportFileFormat.XLSX])(
    'explains an empty classroom in %s',
    (format) => {
      const report = buildClassFinalReportFixture();
      report.alunos = [];
      report.problemas = [];
      const document = buildClassFinalReportDocument(report, format);
      const section = document.sections[0] as ReportTextSection;
      expect(section.kind).toBe('text');
      expect(section.entries).toEqual(
        expect.arrayContaining([
          { label: 'Alunos', text: 'Nenhum aluno vinculado à turma.' },
          { label: 'Problemas', text: 'Nenhum problema cadastrado na turma.' },
        ]),
      );
    },
  );

  it('keeps students and pending averages when the classroom has no problems', () => {
    const report = buildClassFinalReportFixture();
    report.problemas = [];
    report.alunos = report.alunos.map((student) => ({
      ...student,
      notasProblemas: [],
      mediaGeral: null,
      isParcial: true,
    }));
    const document = buildClassFinalReportDocument(report, ReportFileFormat.PDF);
    const section = document.sections[0] as ReportTableSection;
    expect(section.rows).toHaveLength(3);
    expect(section.rows[0]).toEqual(['Ana Souza', '00000001', null, 'Pendente']);
  });
});
