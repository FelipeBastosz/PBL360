import { randomUUID } from 'node:crypto';
import type { Response } from 'supertest';
import type { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Workbook, type Worksheet } from 'exceljs';
import type { ClassFinalReportResponseDto } from '@/grades/application/dtos/class-final-report-response.dto';
import type { ReportTableSection } from '@/report-files/domain/report-document';
import {
  PDF_REPORT_RENDERER,
  XLSX_REPORT_RENDERER,
  type ReportRenderer,
} from '@/report-files/domain/services/report-renderer';
import { createTestApp } from './helpers/create-test-app';
import { api, cleanDatabase } from './helpers/fixtures';
import {
  createClassReportFixture,
  createReportProblem,
  saveReportEvaluation,
  type ClassReportFixture,
} from './helpers/class-report-fixtures';

const binaryParser = (
  response: Response,
  callback: (error: Error | null, body: Buffer) => void,
): void => {
  const chunks: Buffer[] = [];
  response.on('data', (chunk: Buffer | string) =>
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)),
  );
  response.on('end', () => callback(null, Buffer.concat(chunks)));
  response.on('error', (error: Error) => callback(error, Buffer.alloc(0)));
};

const excelRowByLabel = (sheet: Worksheet, label: string, columns: number): unknown[] => {
  let result: unknown[] = [];
  sheet.eachRow((row) => {
    if (row.getCell(1).value === label)
      result = Array.from({ length: columns }, (_, i) => row.getCell(i + 1).value);
  });
  return result;
};

describe('Class final report export (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let fixture: ClassReportFixture;
  let firstSessionId: string;
  const reportPath = () => `/salas/${fixture.roomId}/relatorio-final`;
  const exportPath = (format: string) => `${reportPath()}/exportacao?formato=${format}`;

  beforeAll(async () => {
    const created = await createTestApp();
    app = created.app;
    dataSource = created.moduleRef.get(DataSource);
  }, 30000);

  beforeEach(async () => {
    await cleanDatabase(dataSource);
    fixture = await createClassReportFixture(app, dataSource);
    firstSessionId = (await createReportProblem(app, dataSource, fixture, 1, 8)).sessionId;
    await createReportProblem(app, dataSource, fixture, 2, 0);
    await createReportProblem(app, dataSource, fixture, 3, null);
  }, 30000);

  afterEach(() => jest.restoreAllMocks());

  afterAll(async () => {
    try {
      if (dataSource?.isInitialized) await cleanDatabase(dataSource);
    } finally {
      await app?.close();
    }
  }, 30000);

  const readReport = async (): Promise<ClassFinalReportResponseDto> => {
    const response = await api(app, fixture.owner).get(reportPath()).expect(200);
    return response.body as ClassFinalReportResponseDto;
  };

  const readWorkbook = async (): Promise<Workbook> => {
    const response = await api(app, fixture.owner)
      .get(exportPath('XLSX'))
      .buffer(true)
      .parse(binaryParser)
      .expect(200)
      .expect('Content-Type', /application\/vnd.openxmlformats-officedocument.spreadsheetml.sheet/)
      .expect('Content-Disposition', /attachment;.*\.xlsx/)
      .expect('Cache-Control', 'private, no-store');
    const workbook = new Workbook();
    await workbook.xlsx.load(Uint8Array.from(response.body as Buffer).buffer);
    return workbook;
  };

  it('matches the JSON consolidation in Excel, preserving zero, partial averages and pending students', async () => {
    const report = await readReport();
    const workbook = await readWorkbook();
    const sheet = workbook.getWorksheet('Notas finais')!;
    expect(report.alunos[0]).toMatchObject({ nome: 'Ana Souza', mediaGeral: 4, isParcial: true });
    expect(report.alunos[0]?.notasProblemas.map((item) => item.notaFinal)).toEqual([8, 0, null]);
    expect(report.alunos[1]).toMatchObject({ mediaGeral: null, isParcial: true });
    for (const student of report.alunos) {
      const status =
        student.mediaGeral === null ? 'Pendente' : student.isParcial ? 'Parcial' : 'Completa';
      expect(excelRowByLabel(sheet, student.nome, 7)).toEqual([
        student.nome,
        student.matricula,
        ...student.notasProblemas.map((item) => item.notaFinal),
        student.mediaGeral,
        status,
      ]);
    }
    expect(excelRowByLabel(sheet, 'Turma', 2)[1]).toBe(report.sala.nome);
  }, 30000);

  it('renders the same consolidated values in a complete downloadable PDF', async () => {
    const report = await readReport();
    const render = jest.spyOn(app.get<ReportRenderer>(PDF_REPORT_RENDERER), 'render');
    const response = await api(app, fixture.owner)
      .get(exportPath('PDF'))
      .buffer(true)
      .parse(binaryParser)
      .expect(200)
      .expect('Content-Type', /application\/pdf/)
      .expect('Content-Disposition', /attachment;.*\.pdf/);
    const content = response.body as Buffer;
    expect(content.subarray(0, 5).toString()).toBe('%PDF-');
    expect(content.subarray(-8).toString()).toContain('%%EOF');
    const document = render.mock.calls[0]![0];
    const table = document.sections[0] as ReportTableSection;
    expect(table.rows[0]).toEqual([
      report.alunos[0]!.nome,
      '00000001',
      ...report.alunos[0]!.notasProblemas.map((item) => item.notaFinal),
      report.alunos[0]!.mediaGeral,
      'Parcial',
    ]);
    expect(table.rows[1]?.slice(-2)).toEqual([null, 'Pendente']);
  }, 30000);

  it('reflects a justified tutor adjustment in the report and the next export', async () => {
    await readWorkbook();
    await saveReportEvaluation(
      app,
      fixture,
      firstSessionId,
      9,
      'Revisão da avaliação após discussão com a aluna.',
    );
    const report = await readReport();
    const sheet = (await readWorkbook()).getWorksheet('Notas finais')!;
    expect(report.alunos[0]).toMatchObject({ mediaGeral: 4.5, isParcial: true });
    expect(report.alunos[0]?.notasProblemas[0]?.notaFinal).toBe(9);
    expect(excelRowByLabel(sheet, 'Ana Souza', 7)).toEqual([
      'Ana Souza',
      '00000001',
      9,
      0,
      null,
      4.5,
      'Parcial',
    ]);
    const [audit] = await dataSource.query<[{ count: string }]>(
      'SELECT count(*) AS count FROM grade_adjustments WHERE created_by = $1',
      [fixture.owner.id],
    );
    expect(Number(audit.count)).toBeGreaterThan(0);
  }, 30000);

  it.each(['PDF', 'XLSX'])(
    'permits the co-tutor and rejects a removed co-tutor for %s',
    async (format) => {
      await api(app, fixture.coTutor).get(reportPath()).expect(200);
      await api(app, fixture.coTutor).get(exportPath(format)).expect(200);
      await dataSource.query('DELETE FROM room_tutors WHERE room_id = $1 AND tutor_id = $2', [
        fixture.roomId,
        fixture.coTutor.id,
      ]);
      await api(app, fixture.coTutor).get(reportPath()).expect(403);
      await api(app, fixture.coTutor).get(exportPath(format)).expect(403);
    },
    30000,
  );

  it('rejects unauthenticated requests, students and unrelated tutors before generating files', async () => {
    const render = jest.spyOn(app.get<ReportRenderer>(PDF_REPORT_RENDERER), 'render');
    for (const path of [reportPath(), exportPath('PDF')]) {
      await api(app).get(path).expect(401);
      await api(app, fixture.student).get(path).expect(403);
      await api(app, fixture.outsider).get(path).expect(403);
    }
    expect(render).not.toHaveBeenCalled();
  });

  it('rejects missing or invalid formats and invalid or nonexistent classrooms', async () => {
    const render = jest.spyOn(app.get<ReportRenderer>(PDF_REPORT_RENDERER), 'render');
    await api(app, fixture.owner).get(`${reportPath()}/exportacao`).expect(400);
    await api(app, fixture.owner).get(exportPath('CSV')).expect(400);
    await api(app, fixture.owner)
      .get('/salas/invalid/relatorio-final/exportacao?formato=PDF')
      .expect(400);
    await api(app, fixture.owner)
      .get(`/salas/${randomUUID()}/relatorio-final/exportacao?formato=PDF`)
      .expect(404);
    expect(render).not.toHaveBeenCalled();
  });

  it('generates valid empty files for a classroom without students or problems', async () => {
    const [room] = await dataSource.query<[{ id: string }]>(
      `INSERT INTO rooms (tutor_id, name, course_code, room_code, semester)
       VALUES ($1, 'Turma vazia', 'MED101', 'EMPTY383', '2026.2') RETURNING id`,
      [fixture.owner.id],
    );
    fixture.roomId = room.id;
    expect((await readReport()).alunos).toEqual([]);
    const workbook = await readWorkbook();
    expect(JSON.stringify(workbook.getWorksheet('Informações do relatório')!.model)).toContain(
      'Nenhum aluno vinculado',
    );
    const response = await api(app, fixture.owner)
      .get(exportPath('PDF'))
      .buffer(true)
      .parse(binaryParser)
      .expect(200);
    expect((response.body as Buffer).subarray(0, 5).toString()).toBe('%PDF-');
  }, 30000);

  it('keeps every problem in wide reports and generates a PDF with several pages', async () => {
    for (let order = 4; order <= 13; order++)
      await createReportProblem(app, dataSource, fixture, order, null);
    const render = jest.spyOn(app.get<ReportRenderer>(PDF_REPORT_RENDERER), 'render');
    const response = await api(app, fixture.owner)
      .get(exportPath('PDF'))
      .buffer(true)
      .parse(binaryParser)
      .expect(200);
    const tables = render.mock.calls[0]![0].sections.filter(
      (section): section is ReportTableSection => section.kind === 'table',
    );
    expect(tables).toHaveLength(5);
    expect(tables.flatMap((table) => table.columns.slice(2, -2))).toHaveLength(13);
    for (const table of tables)
      expect(table.rows[0]?.slice(0, 2)).toEqual(['Ana Souza', '00000001']);
    expect(
      ((response.body as Buffer).toString('latin1').match(/\/Type \/Page\b/g) ?? []).length,
    ).toBeGreaterThan(1);
    expect((await readWorkbook()).getWorksheet('Notas finais')!.columnCount).toBe(17);
  }, 60000);

  it.each([
    ['PDF', PDF_REPORT_RENDERER],
    ['XLSX', XLSX_REPORT_RENDERER],
  ])('returns a clear error and no attachment when %s generation fails', async (format, token) => {
    jest
      .spyOn(app.get<ReportRenderer>(token), 'render')
      .mockRejectedValueOnce(new Error('Internal renderer details'));
    const response = await api(app, fixture.owner)
      .get(exportPath(String(format)))
      .expect(500)
      .expect('Content-Type', /json/);
    expect(response.body).toMatchObject({
      statusCode: 500,
      message: 'Não foi possível gerar o arquivo do relatório.',
    });
    expect(response.headers['content-disposition']).toBeUndefined();
    expect(response.text).not.toContain('Internal renderer details');
  });

  it('documents both formats, errors and the textual registration', async () => {
    const response = await api(app).get('/docs/json').expect(200);
    const document = response.body as {
      paths: Record<
        string,
        {
          get: {
            parameters: Array<{ name: string; schema: { enum?: string[] } }>;
            responses: Record<string, { description: string; content?: Record<string, unknown> }>;
          };
        }
      >;
      components: {
        schemas: Record<
          string,
          { properties: Record<string, { type: string; nullable?: boolean }> }
        >;
      };
    };
    const route = document.paths['/api/salas/{salaId}/relatorio-final/exportacao']!.get;
    expect(route.parameters.find((parameter) => parameter.name === 'formato')?.schema.enum).toEqual(
      ['PDF', 'XLSX'],
    );
    expect(Object.keys(route.responses)).toEqual(
      expect.arrayContaining(['200', '400', '401', '403', '404', '500']),
    );
    expect(route.responses['400']!.description).toContain('PDF nem XLSX');
    expect(route.responses['400']!.description).toContain('UUID válido');
    expect(Object.keys(route.responses['200']!.content!)).toEqual(
      expect.arrayContaining([
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ]),
    );
    expect(document.components.schemas.ClassReportStudentDto!.properties.matricula).toMatchObject({
      type: 'string',
      nullable: true,
    });
  });
});
