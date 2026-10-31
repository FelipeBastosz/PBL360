import type { Server } from 'node:http';
import { type INestApplication } from '@nestjs/common';
import { type TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { Workbook } from 'exceljs';
import { UserType } from '@/users/domain/enums/user-type.enum';
import { REPORT_FILE_GENERATOR } from '@/report-files/domain/services/report-file-generator';
import { ReportGenerationError } from '@/report-files/application/errors/report-generation.error';
import { createTestApp } from './helpers/create-test-app';
import { cleanDatabase, signAccessToken } from './helpers/fixtures';

const binaryParser = (
  res: request.Response,
  callback: (err: Error | null, body: Buffer) => void,
) => {
  const chunks: Buffer[] = [];
  res.on('data', (chunk: Buffer) => chunks.push(chunk));
  res.on('end', () => callback(null, Buffer.concat(chunks)));
};

describe('Problem Report Export (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  let tutorId: string;
  let coTutorId: string;
  let otherTutorId: string;
  let student1Id: string;
  let student2Id: string;
  let roomId: string;
  let otherRoomId: string;
  let problem1Id: string;
  let problem2Id: string;

  let tutorToken: string;
  let coTutorToken: string;
  let otherTutorToken: string;
  let studentToken: string;

  const server = () => request(app.getHttpServer() as Server);
  const exportPath = (rId: string, pId: string, format = 'PDF') =>
    `/api/salas/${rId}/problemas/${pId}/relatorio/exportacao?formato=${format}`;

  beforeAll(async () => {
    let moduleRef: TestingModule;
    ({ app, moduleRef } = await createTestApp());
    dataSource = moduleRef.get(DataSource);
  });

  afterAll(async () => {
    await cleanDatabase(dataSource);
    await app.close();
  });

  beforeEach(async () => {
    await cleanDatabase(dataSource);

    const [tutor] = await dataSource.query<[{ id: string }]>(
      `INSERT INTO users (name, email, password_hash, type, active)
       VALUES ('Carlos Professor', 'carlos.tutor@uefs.br', 'hash', $1, true) RETURNING id;`,
      [UserType.TUTOR],
    );
    tutorId = tutor.id;
    tutorToken = signAccessToken(app, tutorId, 'carlos.tutor@uefs.br', UserType.TUTOR);

    const [coTutor] = await dataSource.query<[{ id: string }]>(
      `INSERT INTO users (name, email, password_hash, type, active)
       VALUES ('Maria Co-tutora', 'maria.cotutor@uefs.br', 'hash', $1, true) RETURNING id;`,
      [UserType.TUTOR],
    );
    coTutorId = coTutor.id;
    coTutorToken = signAccessToken(app, coTutorId, 'maria.cotutor@uefs.br', UserType.TUTOR);

    const [otherTutor] = await dataSource.query<[{ id: string }]>(
      `INSERT INTO users (name, email, password_hash, type, active)
       VALUES ('Outro Professor', 'outro.tutor@uefs.br', 'hash', $1, true) RETURNING id;`,
      [UserType.TUTOR],
    );
    otherTutorId = otherTutor.id;
    otherTutorToken = signAccessToken(app, otherTutorId, 'outro.tutor@uefs.br', UserType.TUTOR);

    const [student1] = await dataSource.query<[{ id: string }]>(
      `INSERT INTO users (name, email, password_hash, type, registration_number, active)
       VALUES ('Ana Souza', 'ana.souza@discente.uefs.br', 'hash', $1, '20260001', true) RETURNING id;`,
      [UserType.STUDENT],
    );
    student1Id = student1.id;
    studentToken = signAccessToken(app, student1Id, 'ana.souza@discente.uefs.br', UserType.STUDENT);

    const [student2] = await dataSource.query<[{ id: string }]>(
      `INSERT INTO users (name, email, password_hash, type, registration_number, active)
       VALUES ('Bruno Lima', 'bruno.lima@discente.uefs.br', 'hash', $1, '20260002', true) RETURNING id;`,
      [UserType.STUDENT],
    );
    student2Id = student2.id;

    const [room] = await dataSource.query<[{ id: string }]>(
      `INSERT INTO rooms (tutor_id, name, course_code, room_code, semester, active)
       VALUES ($1, 'Turma A — Medicina', 'MED101', 'MED2026A', '2026.2', true) RETURNING id;`,
      [tutorId],
    );
    roomId = room.id;

    const [otherRoom] = await dataSource.query<[{ id: string }]>(
      `INSERT INTO rooms (tutor_id, name, course_code, room_code, semester, active)
       VALUES ($1, 'Turma B — Enfermagem', 'ENF101', 'ENF2026B', '2026.2', true) RETURNING id;`,
      [otherTutorId],
    );
    otherRoomId = otherRoom.id;

    await dataSource.query(`INSERT INTO room_tutors (room_id, tutor_id) VALUES ($1, $2);`, [
      roomId,
      coTutorId,
    ]);

    await dataSource.query(
      `INSERT INTO room_students (room_id, student_id) VALUES ($1, $2), ($1, $3);`,
      [roomId, student1Id, student2Id],
    );

    const [p1] = await dataSource.query<[{ id: string }]>(
      `INSERT INTO problems (room_id, title, description, order_index, created_by)
       VALUES ($1, 'Problema 1 — Dor torácica', 'Caso de dor precordial', 1, $2) RETURNING id;`,
      [roomId, tutorId],
    );
    problem1Id = p1.id;

    const [p2] = await dataSource.query<[{ id: string }]>(
      `INSERT INTO problems (room_id, title, description, order_index, created_by)
       VALUES ($1, 'Problema 2 — Cefaleia aguda', 'Caso neurológico agudo', 2, $2) RETURNING id;`,
      [roomId, tutorId],
    );
    problem2Id = p2.id;

    // Seed Problem 1 sessions
    const [p1s1] = await dataSource.query<[{ id: string }]>(
      `INSERT INTO sessions (problem_id, performance_table_id, title, date, order_index)
       VALUES ($1, '34200000-0000-4000-8000-000000000001', 'Abertura', '2026-10-01', 1) RETURNING id;`,
      [problem1Id],
    );
    const [p1s2] = await dataSource.query<[{ id: string }]>(
      `INSERT INTO sessions (problem_id, performance_table_id, title, date, order_index)
       VALUES ($1, '34200000-0000-4000-8000-000000000001', 'Fechamento', '2026-10-08', 2) RETURNING id;`,
      [problem1Id],
    );

    // Seed Problem 2 session
    const [p2s1] = await dataSource.query<[{ id: string }]>(
      `INSERT INTO sessions (problem_id, performance_table_id, title, date, order_index)
       VALUES ($1, '34200000-0000-4000-8000-000000000001', 'Discussão Inicial P2', '2026-10-15', 1) RETURNING id;`,
      [problem2Id],
    );

    // Criteria for Problem 1
    const [criterion1] = await dataSource.query<[{ id: string }]>(
      `SELECT id FROM performance_criteria WHERE performance_table_id = '34200000-0000-4000-8000-000000000001' AND order_index = 1 LIMIT 1;`,
    );

    // Evaluations for Problem 1
    // Student 1: Evaluated in Session 1 and Session 2
    await dataSource.query(
      `INSERT INTO criterion_grades (session_id, student_id, criterion_id, score)
       VALUES ($1, $2, $3, 8.5);`,
      [p1s1.id, student1Id, criterion1.id],
    );

    await dataSource.query(
      `INSERT INTO criterion_grades (session_id, student_id, criterion_id, score)
       VALUES ($1, $2, $3, 9.5);`,
      [p1s2.id, student1Id, criterion1.id],
    );

    // Student 1: Self assessment with adjustment in grade_adjustments
    const [selfEval] = await dataSource.query<[{ id: string }]>(
      `INSERT INTO evaluations (evaluator_id, student_id, problem_id, session_id, performance_table_id, type, status, submitted_at, session_score, created_by)
       VALUES ($1, $1, $2, $3, '34200000-0000-4000-8000-000000000001', 'SELF_ASSESSMENT', 'SUBMITTED', now(), 7.0, $1) RETURNING id;`,
      [student1Id, problem1Id, p1s1.id],
    );
    await dataSource.query(
      `INSERT INTO grade_adjustments (evaluation_id, previous_value, new_value, justification, created_by)
       VALUES ($1, 7.0, 9.0, 'Ajuste de autoavaliação pelo tutor', $2);`,
      [selfEval.id, tutorId],
    );

    // Student 2: Evaluated in Session 2 only (Session 1 is pending/null!)
    await dataSource.query(
      `INSERT INTO criterion_grades (session_id, student_id, criterion_id, score)
       VALUES ($1, $2, $3, 6.0);`,
      [p1s2.id, student2Id, criterion1.id],
    );

    // Problem 2 evaluations
    await dataSource.query(
      `INSERT INTO criterion_grades (session_id, student_id, criterion_id, score)
       VALUES ($1, $2, $3, 4.0);`,
      [p2s1.id, student1Id, criterion1.id],
    );

    // Problem 1 Feedbacks
    await dataSource.query(
      `INSERT INTO feedback (autor_id, problema_id, escopo, texto)
       VALUES ($1, $2, 'PROBLEMA', 'Feedback geral do problema 1 - Excelente engajamento');`,
      [tutorId, problem1Id],
    );

    await dataSource.query(
      `INSERT INTO feedback (autor_id, problema_id, sessao_id, destinatario_id, escopo, texto)
       VALUES ($1, $2, $3, $4, 'SESSAO', 'Ana conduziu muito bem a discussão de abertura.');`,
      [tutorId, problem1Id, p1s1.id, student1Id],
    );

    await dataSource.query(
      `INSERT INTO feedback (autor_id, problema_id, destinatario_id, escopo, nota, texto)
       VALUES ($1, $2, $3, 'ALUNO', 9.0, 'Desempenho exemplar de Ana no problema 1 como um todo.');`,
      [coTutorId, problem1Id, student1Id],
    );

    // Problem 2 Feedbacks
    await dataSource.query(
      `INSERT INTO feedback (autor_id, problema_id, escopo, texto)
       VALUES ($1, $2, 'PROBLEMA', 'Feedback exclusivo do Problema 2 - Atenção aos prazos');`,
      [tutorId, problem2Id],
    );
  });

  describe('Isolation between problems and content verification', () => {
    it('exports Problem 1 in PDF with only Problem 1 data, adjusted grades, and feedbacks', async () => {
      const res = await server()
        .get(exportPath(roomId, problem1Id, 'PDF'))
        .set('Authorization', `Bearer ${tutorToken}`)
        .buffer(true)
        .parse(binaryParser)
        .expect(200);

      expect(res.headers['content-type']).toBe('application/pdf');
      expect(res.headers['cache-control']).toBe('private, no-store');
      expect(res.headers['content-disposition']).toContain('relatorio-problema-1');
      expect(res.headers['content-disposition']).toContain('Turma-A');
      expect(res.headers['content-disposition']).toContain('.pdf');
      expect(Buffer.isBuffer(res.body)).toBe(true);

      const pdfText = (res.body as Buffer).toString('latin1');
      // Contains Problem 1 title and students
      expect(pdfText).toContain('%PDF-');
      // Verify Problem 2 is NOT present
      expect(pdfText).not.toContain('Cefaleia aguda');
      expect(pdfText).not.toContain('Feedback exclusivo do Problema 2');
    });

    it('exports Problem 1 in XLSX containing only Problem 1 data, adjusted grades, pendencies, and feedbacks', async () => {
      const res = await server()
        .get(exportPath(roomId, problem1Id, 'XLSX'))
        .set('Authorization', `Bearer ${tutorToken}`)
        .buffer(true)
        .parse(binaryParser)
        .expect(200);

      expect(res.headers['content-type']).toBe(
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      expect(res.headers['cache-control']).toBe('private, no-store');
      expect(res.headers['content-disposition']).toContain('relatorio-problema-1');
      expect(res.headers['content-disposition']).toContain('Turma-A');
      expect(res.headers['content-disposition']).toContain('.xlsx');

      const workbook = new Workbook();
      await workbook.xlsx.load(res.body as Buffer);

      // Verify Sheets
      const sheetNames = workbook.worksheets.map((w) => w.name);
      expect(sheetNames).toContain('Notas por sessão');
      expect(sheetNames).toContain('Feedback geral do problema');
      expect(sheetNames).toContain('Feedbacks das sessões');
      expect(sheetNames).toContain('Feedbacks individuais');
      expect(sheetNames).toContain('Informações do relatório');

      // Verify Table Sheet
      const gradesSheet = workbook.getWorksheet('Notas por sessão');
      expect(gradesSheet).toBeDefined();

      let headerRowValues: unknown[] = [];
      let anaRowValues: unknown[] = [];
      let brunoRowValues: unknown[] = [];

      gradesSheet?.eachRow((row) => {
        const firstCell = row.getCell(1).text;
        if (firstCell === 'Aluno') {
          headerRowValues = (row.values as unknown[]).slice(1);
        } else if (firstCell === 'Ana Souza') {
          anaRowValues = (row.values as unknown[]).slice(1);
        } else if (firstCell === 'Bruno Lima') {
          brunoRowValues = (row.values as unknown[]).slice(1);
        }
      });

      // Headers contain Problem 1 sessions, NOT Problem 2
      expect(headerRowValues).toContain('Abertura');
      expect(headerRowValues).toContain('Fechamento');
      expect(headerRowValues).toContain('Nota final');
      expect(headerRowValues).not.toContain('Discussão Inicial P2');

      // Ana Souza has numeric grades and matricula string
      expect(anaRowValues[0]).toBe('Ana Souza');
      expect(anaRowValues[1]).toBe('20260001');
      expect(typeof anaRowValues[2]).toBe('number'); // Session 1 score
      expect(typeof anaRowValues[3]).toBe('number'); // Session 2 score
      expect(typeof anaRowValues[4]).toBe('number'); // Final score

      // Bruno Lima has pendencies (Session 1 null/empty, Session 2 evaluated)
      expect(brunoRowValues[0]).toBe('Bruno Lima');
      expect(brunoRowValues[2] == null).toBe(true); // Pending session 1
      expect(typeof brunoRowValues[3]).toBe('number'); // Session 2 score
      expect(typeof brunoRowValues[4]).toBe('number'); // Final score calculated from available session

      // Verify Pendencies Sheet
      const pendenciesSheet = workbook.getWorksheet('Pendências de avaliação');
      expect(pendenciesSheet).toBeDefined();
      let pendingBrunoFound = false;
      pendenciesSheet?.eachRow((row) => {
        const studentCell = row.getCell(1).text;
        const sessionCell = row.getCell(3).text;
        if (studentCell === 'Bruno Lima' && sessionCell === 'Abertura') {
          pendingBrunoFound = true;
        }
      });
      expect(pendingBrunoFound).toBe(true);

      // Verify General Feedback Sheet
      const generalSheet = workbook.getWorksheet('Feedback geral do problema');
      let generalFeedbackFound = false;
      let problem2FeedbackFound = false;
      generalSheet?.eachRow((row) => {
        const text = row.getCell(2).text;
        if (text.includes('Excelente engajamento')) generalFeedbackFound = true;
        if (text.includes('Feedback exclusivo do Problema 2')) problem2FeedbackFound = true;
      });
      expect(generalFeedbackFound).toBe(true);
      expect(problem2FeedbackFound).toBe(false);

      // Verify Session Feedbacks Sheet
      const sessionFeedbacksSheet = workbook.getWorksheet('Feedbacks das sessões');
      let sessionFeedbackFound = false;
      sessionFeedbacksSheet?.eachRow((row) => {
        const label = row.getCell(1).text;
        const text = row.getCell(2).text;
        if (
          label.includes('Ana Souza') &&
          label.includes('Carlos Professor') &&
          text.includes('conduziu muito bem')
        ) {
          sessionFeedbackFound = true;
        }
      });
      expect(sessionFeedbackFound).toBe(true);

      // Verify Individual Feedbacks Sheet
      const studentFeedbacksSheet = workbook.getWorksheet('Feedbacks individuais');
      let studentFeedbackFound = false;
      studentFeedbacksSheet?.eachRow((row) => {
        const label = row.getCell(1).text;
        const text = row.getCell(2).text;
        if (
          label.includes('Ana Souza') &&
          label.includes('Maria Co-tutora') &&
          text.includes('Desempenho exemplar')
        ) {
          studentFeedbackFound = true;
        }
      });
      expect(studentFeedbackFound).toBe(true);
    });

    it('does not include students with justified absence in pendencies of evaluation', async () => {
      // Mark Bruno Lima as EXCUSED in Session 1
      const [p1s1] = await dataSource.query<[{ id: string }]>(
        `SELECT id FROM sessions WHERE problem_id = $1 AND order_index = 1;`,
        [problem1Id],
      );
      await dataSource.query(
        `INSERT INTO attendances (session_id, student_id, recorded_by, status, justification)
         VALUES ($1, $2, $3, 'EXCUSED', 'Atestado de saúde');`,
        [p1s1.id, student2Id, tutorId],
      );

      const res = await server()
        .get(exportPath(roomId, problem1Id, 'XLSX'))
        .set('Authorization', `Bearer ${tutorToken}`)
        .buffer(true)
        .parse(binaryParser)
        .expect(200);

      const workbook = new Workbook();
      await workbook.xlsx.load(res.body as Buffer);
      const sheetNames = workbook.worksheets.map((w) => w.name);
      expect(sheetNames).not.toContain('Pendências de avaliação');

      const gradesSheet = workbook.getWorksheet('Notas por sessão');
      let brunoRowValues: unknown[] = [];
      gradesSheet?.eachRow((row) => {
        if (row.getCell(1).text === 'Bruno Lima') {
          brunoRowValues = (row.values as unknown[]).slice(1);
        }
      });
      expect(brunoRowValues[0]).toBe('Bruno Lima');
      expect(brunoRowValues[2] == null).toBe(true);
      expect(typeof brunoRowValues[3]).toBe('number');
      expect(typeof brunoRowValues[4]).toBe('number');
    });

    it('allows an active co-tutor to export the problem report', async () => {
      const res = await server()
        .get(exportPath(roomId, problem1Id, 'PDF'))
        .set('Authorization', `Bearer ${coTutorToken}`)
        .expect(200);

      expect(res.headers['content-type']).toBe('application/pdf');
      expect(res.headers['cache-control']).toBe('private, no-store');
    });
  });

  describe('Error handling', () => {
    it('returns 400 for an invalid export format', async () => {
      const res = await server()
        .get(exportPath(roomId, problem1Id, 'CSV'))
        .set('Authorization', `Bearer ${tutorToken}`)
        .expect(400);

      const body = res.body as { message: string[] };
      expect(body.message).toContain('O formato do relatório deve ser PDF ou XLSX.');
    });

    it('returns 400 when ocultarNomes is not a valid boolean', async () => {
      const res = await server()
        .get(`${exportPath(roomId, problem1Id, 'PDF')}&ocultarNomes=invalido`)
        .set('Authorization', `Bearer ${tutorToken}`)
        .expect(400);

      const body = res.body as { message: string[] };
      expect(body.message).toContain('O campo ocultarNomes deve ser um booleano.');
    });

    it('exports Problem 1 in XLSX without student names when ocultarNomes=true', async () => {
      const res = await server()
        .get(`${exportPath(roomId, problem1Id, 'XLSX')}&ocultarNomes=true`)
        .set('Authorization', `Bearer ${tutorToken}`)
        .buffer(true)
        .parse(binaryParser)
        .expect(200);

      const workbook = new Workbook();
      await workbook.xlsx.load(res.body as Buffer);

      const gradesSheet = workbook.getWorksheet('Notas por sessão');
      expect(gradesSheet).toBeDefined();

      let headerValues: unknown[] = [];
      const rowValues: unknown[][] = [];

      gradesSheet?.eachRow((row) => {
        const firstCell = row.getCell(1).text;
        if (firstCell === 'Matrícula') {
          headerValues = (row.values as unknown[]).slice(1);
        } else if (firstCell === '20260001' || firstCell === '') {
          rowValues.push((row.values as unknown[]).slice(1));
        }
      });

      expect(headerValues).not.toContain('Aluno');
      expect(headerValues[0]).toBe('Matrícula');

      const allRowTexts = rowValues.map((r) => r.join(' ')).join(' ');
      expect(allRowTexts).not.toContain('Ana Souza');
      expect(allRowTexts).not.toContain('Bruno Lima');

      const pendenciesSheet = workbook.getWorksheet('Pendências de avaliação');
      expect(pendenciesSheet).toBeDefined();
      let pendencyHeader: unknown[] = [];
      pendenciesSheet?.eachRow((row) => {
        if (row.getCell(1).text === 'Matrícula') {
          pendencyHeader = (row.values as unknown[]).slice(1);
        }
      });
      expect(pendencyHeader).toEqual(['Matrícula', 'Sessão pendente']);
    });

    it('returns 401 when request is not authenticated', async () => {
      await server()
        .get(exportPath(roomId, problem1Id, 'PDF'))
        .expect(401);
    });

    it('returns 403 when tutor is not enrolled in the room', async () => {
      const res = await server()
        .get(exportPath(roomId, problem1Id, 'PDF'))
        .set('Authorization', `Bearer ${otherTutorToken}`)
        .expect(403);

      const body = res.body as { message: string };
      expect(body.message).toContain('Você não tem permissão para acessar ou modificar esta sala.');
    });

    it('returns 403 when a student tries to export the report', async () => {
      await server()
        .get(exportPath(roomId, problem1Id, 'PDF'))
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);
    });

    it('returns 404 when problem does not exist', async () => {
      await server()
        .get(exportPath(roomId, '00000000-0000-0000-0000-000000000000', 'PDF'))
        .set('Authorization', `Bearer ${tutorToken}`)
        .expect(404);
    });

    it('returns 404 when problem belongs to another room', async () => {
      // problem1Id belongs to roomId, request with otherRoomId
      await server()
        .get(exportPath(otherRoomId, problem1Id, 'PDF'))
        .set('Authorization', `Bearer ${otherTutorToken}`)
        .expect(404);
    });

    it('returns 500 without delivering partial file when file generation fails', async () => {
      const customApp = await createTestApp((builder) =>
        builder.overrideProvider(REPORT_FILE_GENERATOR).useValue({
          generate: jest.fn().mockRejectedValue(new ReportGenerationError()),
        }),
      );

      try {
        const res = await request(customApp.app.getHttpServer())
          .get(exportPath(roomId, problem1Id, 'PDF'))
          .set('Authorization', `Bearer ${tutorToken}`)
          .expect(500);

        const body = res.body as { message: string };
        expect(res.headers['content-type']).toContain('application/json');
        expect(body.message).toBe('Não foi possível gerar o arquivo do relatório.');
      } finally {
        await customApp.app.close();
      }
    });
  });
});
