import { randomUUID } from 'node:crypto';
import type { INestApplication } from '@nestjs/common';
import type request from 'supertest';
import { DataSource } from 'typeorm';
import { Workbook } from 'exceljs';
import { UserType } from '@/users/domain/enums/user-type.enum';
import { AttendanceStatus } from '@/sessions/domain/enums/attendance-status.enum';
import { SessionRole } from '@/sessions/domain/enums/session-role.enum';
import {
  PDF_REPORT_RENDERER,
  XLSX_REPORT_RENDERER,
  type ReportRenderer,
} from '@/report-files/domain/services/report-renderer';
import { createTestApp } from './helpers/create-test-app';
import { api, cleanDatabase, insertUser, type TestUser } from './helpers/fixtures';

const binaryParser = (
  res: request.Response,
  callback: (err: Error | null, body: Buffer) => void,
) => {
  res.setEncoding('binary');
  let data = '';
  res.on('data', (chunk: string) => {
    data += chunk;
  });
  res.on('end', () => {
    callback(null, Buffer.from(data, 'binary'));
  });
};

async function loadWorkbook(body: unknown): Promise<Workbook> {
  const workbook = new Workbook();
  await workbook.xlsx.load(body as Parameters<typeof workbook.xlsx.load>[0]);
  return workbook;
}

describe('Session report export (e2e)', () => {
  let app: INestApplication;
  let db: DataSource;
  let owner: TestUser;
  let coTutor: TestUser;
  let outsider: TestUser;
  let studentAna: TestUser;
  let studentJoao: TestUser;
  let roomId: string;
  let problemId: string;
  let sessionId: string;
  let tableId: string;
  let crit1Id: string;
  let crit2Id: string;

  const exportPath = (session = sessionId, format = 'PDF') =>
    `/sessoes/${session}/relatorio/exportacao?formato=${format}`;

  beforeAll(async () => {
    const fixture = await createTestApp();
    app = fixture.app;
    db = fixture.moduleRef.get(DataSource);
  });

  afterAll(async () => {
    await cleanDatabase(db);
    await app.close();
  });

  beforeEach(async () => {
    await cleanDatabase(db);

    owner = await insertUser(app, db, 'tutor.owner@uefs.br');
    await db.query("UPDATE users SET name = 'Prof. Carlos' WHERE id = $1", [owner.id]);

    coTutor = await insertUser(app, db, 'tutor.co@uefs.br');
    await db.query("UPDATE users SET name = 'Prof. Co-Tutor' WHERE id = $1", [coTutor.id]);

    outsider = await insertUser(app, db, 'tutor.outsider@uefs.br');

    studentAna = await insertUser(app, db, '20260001@discente.uefs.br', UserType.STUDENT);
    await db.query(
      "UPDATE users SET name = 'Ana Souza', registration_number = '20260001' WHERE id = $1",
      [studentAna.id],
    );

    studentJoao = await insertUser(app, db, '20260002@discente.uefs.br', UserType.STUDENT);
    await db.query(
      "UPDATE users SET name = 'João Silva', registration_number = '20260002' WHERE id = $1",
      [studentJoao.id],
    );

    const [room] = await db.query<[{ id: string }]>(
      `INSERT INTO rooms (tutor_id, name, course_code, room_code, semester, active)
       VALUES ($1, 'Turma A', 'MED01', 'ROOM379', '2026.2', true) RETURNING id;`,
      [owner.id],
    );
    roomId = room.id;

    await db.query('INSERT INTO room_tutors (room_id, tutor_id) VALUES ($1, $2);', [
      roomId,
      coTutor.id,
    ]);

    await db.query('INSERT INTO room_students (room_id, student_id) VALUES ($1, $2), ($1, $3);', [
      roomId,
      studentAna.id,
      studentJoao.id,
    ]);

    // Performance table with 2 criteria: crit1 (weight 4), crit2 (weight 6)
    const [table] = await db.query<[{ id: string }]>(
      "INSERT INTO performance_tables (tutor_id, name, is_default) VALUES ($1, 'Critérios PBL', FALSE) RETURNING id;",
      [owner.id],
    );
    tableId = table.id;

    const criteria = await db.query<{ id: string }[]>(
      `INSERT INTO performance_criteria (performance_table_id, name, order_index, weight)
       VALUES ($1, 'Participação', 1, 4), ($1, 'Fundamentação', 2, 6) RETURNING id;`,
      [tableId],
    );
    crit1Id = criteria[0]!.id;
    crit2Id = criteria[1]!.id;

    const [problem] = await db.query<[{ id: string }]>(
      `INSERT INTO problems (room_id, title, order_index, created_by)
       VALUES ($1, 'Dor torácica aguda', 1, $2) RETURNING id;`,
      [roomId, owner.id],
    );
    problemId = problem.id;

    const [session] = await db.query<[{ id: string }]>(
      `INSERT INTO sessions (problem_id, performance_table_id, title, date, order_index, status)
       VALUES ($1, $2, 'Abertura', '2026-10-14', 1, 'finalizada') RETURNING id;`,
      [problemId, tableId],
    );
    sessionId = session.id;

    // Default session formula (CRITERIOS 70%, PAPEL 30%) is created automatically by database trigger trg_create_session_default_formula

    // Roll call: Ana is PRESENT, João is LATE
    await db.query(
      `INSERT INTO attendances (session_id, student_id, recorded_by, status)
       VALUES ($1, $2, $4, '${AttendanceStatus.PRESENT}'), ($1, $3, $4, '${AttendanceStatus.LATE}');`,
      [sessionId, studentAna.id, studentJoao.id, owner.id],
    );

    // Session role: Ana has COORDINATOR with role_score 5.0
    await api(app, owner)
      .put(`/sessoes/${sessionId}/papeis/${studentAna.id}`, {
        papel: 'COORDENADOR',
        notaPapel: 5,
      })
      .expect(200);

    // Observation tags: Ana has tag
    const [tag] = await db.query<[{ id: string }]>(
      "INSERT INTO behavior_tags (name) VALUES ('Liderança') RETURNING id;",
    );
    const [obs] = await db.query<[{ id: string }]>(
      'INSERT INTO observations (session_id, student_id, author_id) VALUES ($1, $2, $3) RETURNING id;',
      [sessionId, studentAna.id, owner.id],
    );
    await db.query('INSERT INTO observation_tags (observation_id, tag_id) VALUES ($1, $2);', [
      obs.id,
      tag.id,
    ]);

    // Submit evaluation for Ana: score (8*4 + 8*6)/10 = 8.0, bonus = 5.0
    // Total = 8.0 * 0.7 + 5.0 * 0.3 = 5.6 + 1.5 = 7.1
    await api(app, owner)
      .put(`/sessoes/${sessionId}/avaliacoes/${studentAna.id}`, {
        itens: [
          { criterioId: crit1Id, nota: 8 },
          { criterioId: crit2Id, nota: 8 },
        ],
        enviar: true,
      })
      .expect(200);

    // Submit evaluation for João without role bonus: score (8*4 + 8*6)/10 = 8.0, bonus = null
    // Total = 8.0
    await api(app, owner)
      .put(`/sessoes/${sessionId}/avaliacoes/${studentJoao.id}`, {
        itens: [
          { criterioId: crit1Id, nota: 8 },
          { criterioId: crit2Id, nota: 8 },
        ],
        enviar: true,
      })
      .expect(200);

    // Feedbacks: general feedback + student feedback edited by co-tutor
    await db.query(
      `INSERT INTO feedback (id, autor_id, problema_id, sessao_id, destinatario_id, escopo, texto, criado_em)
       VALUES (gen_random_uuid(), $1, $2, $3, NULL, 'SESSAO', 'Feedback geral produtivo.', NOW());`,
      [owner.id, problemId, sessionId],
    );

    const [studentFb] = await db.query<[{ id: string }]>(
      `INSERT INTO feedback (id, autor_id, problema_id, sessao_id, destinatario_id, escopo, texto, criado_em)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, 'SESSAO', 'Texto original de Ana.', NOW()) RETURNING id;`,
      [owner.id, problemId, sessionId, studentAna.id],
    );

    // Co-tutor edits Ana's feedback
    await db.query(
      `INSERT INTO feedback_revisions (id, feedback_id, conteudo_anterior_texto, edited_by, edited_at)
       VALUES (gen_random_uuid(), $1, 'Texto original de Ana.', $2, NOW());`,
      [studentFb.id, coTutor.id],
    );
    await db.query(
      `UPDATE feedback SET texto = 'Texto revisado pelo co-tutor.', editado_em = NOW() WHERE id = $1;`,
      [studentFb.id],
    );
  });

  it('exports session report as PDF with correct headers and content', async () => {
    const res = await api(app, owner)
      .get(exportPath(sessionId, 'PDF'))
      .buffer(true)
      .parse(binaryParser)
      .expect(200)
      .expect('Content-Type', /application\/pdf/)
      .expect('Content-Disposition', /attachment;.*filename="relatorio-sessao-p1-s1\.pdf"/)
      .expect('Cache-Control', 'private, no-store');

    const buffer = res.body as Buffer;
    expect(buffer.subarray(0, 5).toString('utf8')).toBe('%PDF-');
    expect(buffer.length).toBeGreaterThan(1000);
  });

  it('exports session report as XLSX with correct data, matching grades and feedback revision author', async () => {
    const res = await api(app, owner)
      .get(exportPath(sessionId, 'XLSX'))
      .buffer(true)
      .parse(binaryParser)
      .expect(200)
      .expect(
        'Content-Type',
        /application\/vnd\.openxmlformats-officedocument\.spreadsheetml\.sheet/,
      )
      .expect('Content-Disposition', /attachment;.*filename="relatorio-sessao-p1-s1\.xlsx"/)
      .expect('Cache-Control', 'private, no-store');

    const workbook = await loadWorkbook(res.body);

    const sheet = workbook.getWorksheet('Dados da sessão');
    expect(sheet).toBeDefined();

    // Find row for Ana Souza
    let anaRowValues: unknown[] | null = null;
    let joaoRowValues: unknown[] | null = null;

    sheet!.eachRow((row) => {
      const values = row.values as unknown[];
      if (values.includes('Ana Souza')) anaRowValues = values;
      if (values.includes('João Silva')) joaoRowValues = values;
    });

    expect(anaRowValues).toBeDefined();
    // Student, Matricula, Chamada, Papel, Nota adicional de papel, Marcações, Situação, Nota
    expect(anaRowValues).toContain('Ana Souza');
    expect(anaRowValues).toContain('20260001');
    expect(anaRowValues).toContain('Presente');
    expect(anaRowValues).toContain('Coordenador');
    expect(anaRowValues).toContain(5);
    expect(anaRowValues).toContain('Liderança');
    expect(anaRowValues).toContain('Nota enviada');
    expect(anaRowValues).toContain(7.1);

    expect(joaoRowValues).toBeDefined();
    expect(joaoRowValues).toContain('João Silva');
    expect(joaoRowValues).toContain('20260002');
    expect(joaoRowValues).toContain('Atrasado');
    expect(joaoRowValues).toContain('Nota enviada');
    expect(joaoRowValues).toContain(8.0);

    // Inspect Feedbacks worksheet
    const fbSheet = workbook.getWorksheet('Feedbacks da sessão');
    expect(fbSheet).toBeDefined();

    let foundRevisionAuthor = false;
    let foundGeneralFeedback = false;
    fbSheet!.eachRow((row) => {
      const text = JSON.stringify(row.values);
      if (text.includes('Prof. Co-Tutor')) foundRevisionAuthor = true;
      if (text.includes('Feedback geral produtivo.')) foundGeneralFeedback = true;
    });

    expect(foundRevisionAuthor).toBe(true);
    expect(foundGeneralFeedback).toBe(true);
  });

  it('hides student names and excludes feedback when requested', async () => {
    const res = await api(app, owner)
      .get(`${exportPath(sessionId, 'XLSX')}&ocultarNome=true&mostrarFeedBack=false`)
      .buffer(true)
      .parse(binaryParser)
      .expect(200);

    const workbook = await loadWorkbook(res.body);
    expect(workbook.worksheets.map((sheet) => sheet.name)).toEqual(['Dados da sessão']);

    const sheet = workbook.getWorksheet('Dados da sessão')!;
    const exportedValues: unknown[] = [];
    sheet.eachRow((row) => exportedValues.push(...(row.values as unknown[])));

    expect(exportedValues).not.toContain('Ana Souza');
    expect(exportedValues).not.toContain('João Silva');
    expect(exportedValues).toContain('20260001');
    expect(exportedValues).toContain('20260002');
    expect(exportedValues).toContain(7.1);
    expect(exportedValues).toContain(8);
  });

  it('prevents role score divergence when role is modified or added after submission', async () => {
    // 1. Tutor modifies Ana's role score to 10 in session_roles
    await db.query(
      'UPDATE session_roles SET role_score = 10.0 WHERE session_id = $1 AND student_id = $2;',
      [sessionId, studentAna.id],
    );

    // 2. Tutor gives João a role with score 10 in session_roles
    await db.query(
      `INSERT INTO session_roles (session_id, student_id, role, role_score)
       VALUES ($1, $2, '${SessionRole.BOARD_SECRETARY}', 10.0);`,
      [sessionId, studentJoao.id],
    );

    const res = await api(app, owner)
      .get(exportPath(sessionId, 'XLSX'))
      .buffer(true)
      .parse(binaryParser)
      .expect(200);

    const workbook = await loadWorkbook(res.body);
    const sheet = workbook.getWorksheet('Dados da sessão')!;

    let anaRow: unknown[] | null = null;
    let joaoRow: unknown[] | null = null;
    sheet.eachRow((row) => {
      const values = row.values as unknown[];
      if (values.includes('Ana Souza')) anaRow = values;
      if (values.includes('João Silva')) joaoRow = values;
    });

    // Ana: role bonus column remains 5 (frozen appliedBonus), grade remains 7.1
    expect(anaRow).toContain(5);
    expect(anaRow).not.toContain(10);
    expect(anaRow).toContain(7.1);

    // João: role bonus column is null/empty (not 10), grade remains 8.0
    expect(joaoRow).not.toContain(10);
    expect(joaoRow).toContain(8.0);
  });

  it('reflects justified grade adjustments in the exported report', async () => {
    // Adjust Ana's crit1 score from 8 to 10
    // Get evaluation id and item id
    const [evalRow] = await db.query<[{ id: string }]>(
      'SELECT id FROM evaluations WHERE session_id = $1 AND student_id = $2;',
      [sessionId, studentAna.id],
    );
    const [itemRow] = await db.query<[{ id: string }]>(
      'SELECT id FROM evaluation_items WHERE evaluation_id = $1 AND criterion_id = $2;',
      [evalRow.id, crit1Id],
    );

    await db.query('UPDATE evaluation_items SET score = 10 WHERE id = $1;', [itemRow.id]);
    await db.query(
      `INSERT INTO grade_adjustments (evaluation_id, evaluation_item_id, previous_value, new_value, justification, created_by)
       VALUES (NULL, $1, 8, 10, 'Excelente justificativa oral.', $2);`,
      [itemRow.id, owner.id],
    );

    // Ana's new score: crit1=10 (weight 4), crit2=8 (weight 6) -> (10*4 + 8*6)/10 = 8.8
    // Total = 8.8 * 0.7 + 5.0 * 0.3 = 6.16 + 1.5 = 7.66
    const res = await api(app, owner)
      .get(exportPath(sessionId, 'XLSX'))
      .buffer(true)
      .parse(binaryParser)
      .expect(200);

    const workbook = await loadWorkbook(res.body);
    const sheet = workbook.getWorksheet('Dados da sessão')!;

    let anaRow: unknown[] | null = null;
    sheet.eachRow((row) => {
      const values = row.values as unknown[];
      if (values.includes('Ana Souza')) anaRow = values;
    });

    expect(anaRow).toContain(7.7);
  });

  it('allows co-tutor to export report and rejects removed co-tutor', async () => {
    await api(app, coTutor).get(exportPath(sessionId, 'PDF')).expect(200);

    // Remove co-tutor from room
    await db.query('DELETE FROM room_tutors WHERE room_id = $1 AND tutor_id = $2;', [
      roomId,
      coTutor.id,
    ]);

    await api(app, coTutor).get(exportPath(sessionId, 'PDF')).expect(403);
  });

  it('rejects unauthenticated requests, students, and unrelated tutors', async () => {
    await api(app).get(exportPath(sessionId, 'PDF')).expect(401);
    await api(app, studentAna).get(exportPath(sessionId, 'PDF')).expect(403);
    await api(app, outsider).get(exportPath(sessionId, 'PDF')).expect(403);
  });

  it('rejects invalid inputs (missing format, invalid format, invalid uuid, nonexistent session)', async () => {
    await api(app, owner).get(`/sessoes/${sessionId}/relatorio/exportacao`).expect(400);
    await api(app, owner).get(exportPath(sessionId, 'CSV')).expect(400);
    await api(app, owner)
      .get(`${exportPath(sessionId, 'PDF')}&ocultarNome=invalido`)
      .expect(400);
    await api(app, owner)
      .get(`${exportPath(sessionId, 'PDF')}&mostrarFeedBack=invalido`)
      .expect(400);
    await api(app, owner)
      .get(`${exportPath(sessionId, 'PDF')}&mostrarMarcacoes=invalido`)
      .expect(400);
    await api(app, owner).get('/sessoes/not-a-uuid/relatorio/exportacao?formato=PDF').expect(400);
    await api(app, owner).get(exportPath(randomUUID(), 'PDF')).expect(404);
  });

  it.each([
    ['PDF', PDF_REPORT_RENDERER],
    ['XLSX', XLSX_REPORT_RENDERER],
  ])('returns 500 when %s report renderer fails', async (format, token) => {
    jest
      .spyOn(app.get<ReportRenderer>(token), 'render')
      .mockRejectedValueOnce(new Error('Renderer engine crash'));

    const res = await api(app, owner)
      .get(exportPath(sessionId, String(format)))
      .expect(500)
      .expect('Content-Type', /json/);

    expect(res.body).toMatchObject({
      statusCode: 500,
      message: 'Não foi possível gerar o arquivo do relatório.',
    });
    expect(res.headers['content-disposition']).toBeUndefined();
    expect(res.text).not.toContain('Renderer engine crash');
  });

  it('exports valid empty report when classroom has no students', async () => {
    const [emptyRoom] = await db.query<[{ id: string }]>(
      `INSERT INTO rooms (tutor_id, name, course_code, room_code, semester, active)
       VALUES ($1, 'Turma Vazia', 'MED02', 'EMPTY379', '2026.2', true) RETURNING id;`,
      [owner.id],
    );
    const [emptyProb] = await db.query<[{ id: string }]>(
      `INSERT INTO problems (room_id, title, order_index, created_by)
       VALUES ($1, 'Problema Vazio', 1, $2) RETURNING id;`,
      [emptyRoom.id, owner.id],
    );
    const [emptySess] = await db.query<[{ id: string }]>(
      `INSERT INTO sessions (problem_id, performance_table_id, title, date, order_index, status)
       VALUES ($1, $2, 'Sessão Vazia', '2026-10-14', 1, 'agendada') RETURNING id;`,
      [emptyProb.id, tableId],
    );

    const res = await api(app, owner)
      .get(exportPath(emptySess.id, 'PDF'))
      .buffer(true)
      .parse(binaryParser)
      .expect(200);

    const buffer = res.body as Buffer;
    expect(buffer.subarray(0, 5).toString('utf8')).toBe('%PDF-');
  });
});
