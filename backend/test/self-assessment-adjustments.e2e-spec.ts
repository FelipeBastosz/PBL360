import type { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { UserType } from '@/users/domain/enums/user-type.enum';
import { createTestApp } from './helpers/create-test-app';
import { api, cleanDatabase, insertUser, type TestUser } from './helpers/fixtures';

interface AdjustmentBody {
  valorAnterior: number;
  valorNovo: number;
  justificativa: string;
  autor: { id: string; nome: string };
  ajustadoEm: string;
  autorId?: string;
  criadoEm?: string;
}

interface AdjustmentResponseBody {
  alunoId: string;
  notaOriginal: number;
  notaVigente: number;
  ajuste: AdjustmentBody;
}

interface HistoryBody {
  notaOriginal: number | null;
  notaVigente: number | null;
  ajustes: AdjustmentBody[];
}

describe('Self-assessment adjustments (e2e)', () => {
  let app: INestApplication;
  let db: DataSource;
  let tutor: TestUser;
  let outsiderTutor: TestUser;
  let student: TestUser;
  let draftStudent: TestUser;
  let sessionId: string;
  let firstCriterionId: string;
  let secondCriterionId: string;

  const justificativa = 'Nota revisada após conversa com o aluno.';
  const adjustmentsPath = (studentId = student.id) =>
    `/sessoes/${sessionId}/autoavaliacoes/${studentId}/ajustes`;
  const selfAssessmentPath = () => `/sessoes/${sessionId}/autoavaliacao`;
  const items = (first: number, second: number) => [
    { criterioId: firstCriterionId, nota: first },
    { criterioId: secondCriterionId, nota: second },
  ];

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
    tutor = await insertUser(app, db, 'adjust-tutor@uefs.br');
    outsiderTutor = await insertUser(app, db, 'adjust-outsider@uefs.br');
    student = await insertUser(app, db, 'adjust-student@discente.uefs.br', UserType.STUDENT);
    draftStudent = await insertUser(app, db, 'adjust-draft@discente.uefs.br', UserType.STUDENT);
    const [room] = await db.query<[{ id: string }]>(
      `INSERT INTO rooms (tutor_id, name, course_code, room_code, semester, active)
       VALUES ($1, 'Sala de ajustes', 'EXA123', 'ADJS1234', '2026.2', true) RETURNING id;`,
      [tutor.id],
    );
    await db.query('INSERT INTO room_tutors (room_id, tutor_id) VALUES ($1, $2);', [
      room.id,
      tutor.id,
    ]);
    await db.query('INSERT INTO room_students (room_id, student_id) VALUES ($1, $2), ($1, $3);', [
      room.id,
      student.id,
      draftStudent.id,
    ]);
    const [table] = await db.query<[{ id: string }]>(
      `INSERT INTO performance_tables (tutor_id, name, is_default)
       VALUES ($1, 'Tabela de ajustes', FALSE) RETURNING id;`,
      [tutor.id],
    );
    const criteria = await db.query<{ id: string }[]>(
      `INSERT INTO performance_criteria (performance_table_id, name, order_index, weight)
       VALUES ($1, 'Participação', 1, 1), ($1, 'Autonomia', 2, 3) RETURNING id;`,
      [table.id],
    );
    firstCriterionId = criteria[0]!.id;
    secondCriterionId = criteria[1]!.id;
    const [problem] = await db.query<[{ id: string }]>(
      `INSERT INTO problems (room_id, title, order_index, created_by)
       VALUES ($1, 'Problema da sessão', 1, $2) RETURNING id;`,
      [room.id, tutor.id],
    );
    const [session] = await db.query<[{ id: string }]>(
      `INSERT INTO sessions (
         problem_id, performance_table_id, title, date, order_index, status,
         self_eval_released, self_eval_deadline
       ) VALUES ($1, $2, 'Sessão avaliada', '2026-10-05', 1, 'agendada', true, '2099-10-05')
       RETURNING id;`,
      [problem.id, table.id],
    );
    sessionId = session.id;
    await db.query(
      `INSERT INTO attendances (session_id, student_id, recorded_by, status)
       VALUES ($1, $2, $3, 'PRESENT'), ($1, $4, $3, 'PRESENT');`,
      [sessionId, student.id, tutor.id, draftStudent.id],
    );
    await api(app, student)
      .put(selfAssessmentPath(), { itens: items(7, 9), enviar: true })
      .expect(200);
  });

  it('adjusts the self-assessment keeping the original score and the latest-first history', async () => {
    const first = await api(app, tutor)
      .post(adjustmentsPath(), { novaNota: 9.25, justificativa: `  ${justificativa}  ` })
      .expect(200);
    expect(first.body as AdjustmentResponseBody).toMatchObject({
      alunoId: student.id,
      notaOriginal: 8.5,
      notaVigente: 9.25,
      ajuste: {
        valorAnterior: 8.5,
        valorNovo: 9.25,
        justificativa,
        autorId: tutor.id,
        autor: { id: tutor.id, nome: 'Usuário de Teste' },
      },
    });

    await api(app, tutor)
      .post(adjustmentsPath(), { novaNota: 6, justificativa: 'Segunda revisão da nota.' })
      .expect(200);

    const history = await api(app, tutor).get(adjustmentsPath()).expect(200);
    const body = history.body as HistoryBody;
    expect(body).toMatchObject({ notaOriginal: 8.5, notaVigente: 6 });
    expect(body.ajustes.map(({ valorAnterior, valorNovo }) => [valorAnterior, valorNovo])).toEqual([
      [9.25, 6],
      [8.5, 9.25],
    ]);

    const [evaluation] = await db.query<[{ session_score: string }]>(
      `SELECT session_score FROM evaluations
        WHERE session_id = $1 AND student_id = $2 AND type = 'SELF_ASSESSMENT';`,
      [sessionId, student.id],
    );
    expect(Number(evaluation.session_score)).toBe(8.5);
  });

  it('rejects a score equal to the current one and an out-of-bounds justification', async () => {
    await api(app, tutor).post(adjustmentsPath(), { novaNota: 8.5, justificativa }).expect(422);
    await api(app, tutor)
      .post(adjustmentsPath(), { novaNota: 9, justificativa: '   curta   ' })
      .expect(422);
    await api(app, tutor)
      .post(adjustmentsPath(), { novaNota: 9, justificativa: 'a'.repeat(501) })
      .expect(422);

    await api(app, tutor).post(adjustmentsPath(), { novaNota: 9, justificativa }).expect(200);
    await api(app, tutor).post(adjustmentsPath(), { novaNota: 9, justificativa }).expect(422);
  });

  it('rejects malformed scores', async () => {
    for (const novaNota of [10.5, -1, 8.756, '9']) {
      await api(app, tutor).post(adjustmentsPath(), { novaNota, justificativa }).expect(400);
    }
  });

  it('rejects missing and unsubmitted self-assessments', async () => {
    await api(app, tutor)
      .post(adjustmentsPath(draftStudent.id), { novaNota: 9, justificativa })
      .expect(404);
    await api(app, tutor).get(adjustmentsPath(draftStudent.id)).expect(404);

    await api(app, draftStudent)
      .put(selfAssessmentPath(), { itens: items(5, 6), enviar: false })
      .expect(200);
    await api(app, tutor)
      .post(adjustmentsPath(draftStudent.id), { novaNota: 9, justificativa })
      .expect(409);
    const draft = await api(app, tutor).get(adjustmentsPath(draftStudent.id)).expect(200);
    expect(draft.body as HistoryBody).toEqual({
      notaOriginal: null,
      notaVigente: null,
      ajustes: [],
    });
  });

  it('restricts adjustments to tutors linked to the room', async () => {
    await api(app, student).post(adjustmentsPath(), { novaNota: 9, justificativa }).expect(403);
    await api(app, student).get(adjustmentsPath()).expect(403);
    await api(app, outsiderTutor)
      .post(adjustmentsPath(), { novaNota: 9, justificativa })
      .expect(403);
    await api(app).get(adjustmentsPath()).expect(401);
  });

  it('validates tipo parameter returning 400 when invalid in POST and GET', async () => {
    await api(app, tutor)
      .post(adjustmentsPath(), { novaNota: 9, justificativa, tipo: 'XYZ' })
      .expect(400);

    await api(app, tutor).get(`${adjustmentsPath()}?tipo=XYZ`).expect(400);
  });

  it('handles peer assessment adjustments: blocks while release is open and keeps original score immutable after close', async () => {
    const peerStudent = draftStudent;
    // Insert peer evaluations for peerStudent
    await db.query(
      `INSERT INTO evaluations (evaluator_id, student_id, problem_id, session_id, performance_table_id, type, status, submitted_at, session_score, created_by)
       VALUES ($1, $2, (SELECT problem_id FROM sessions WHERE id = $3), $3, (SELECT performance_table_id FROM sessions WHERE id = $3), 'PEER_ASSESSMENT', 'SUBMITTED', NOW(), 7.55, $1);`,
      [student.id, peerStudent.id, sessionId],
    );

    // When peer release is open, adjustments are blocked with 409
    await db.query('UPDATE sessions SET peer_eval_released = true WHERE id = $1;', [sessionId]);
    const blocked = await api(app, tutor)
      .post(adjustmentsPath(peerStudent.id), { novaNota: 8.5, justificativa, tipo: 'PARES' })
      .expect(409);
    expect((blocked.body as { message: string }).message).toBe(
      'A avaliação entre pares ainda não foi finalizada.',
    );

    const draftHistory = await api(app, tutor)
      .get(`${adjustmentsPath(peerStudent.id)}?tipo=PARES`)
      .expect(200);
    expect(draftHistory.body as HistoryBody).toEqual({
      notaOriginal: null,
      notaVigente: null,
      ajustes: [],
    });

    // Close peer release
    await db.query('UPDATE sessions SET peer_eval_released = false WHERE id = $1;', [sessionId]);

    // Now adjustment is accepted; original score uses presentGrade (7.55 -> 7.6)
    const adjusted = await api(app, tutor)
      .post(adjustmentsPath(peerStudent.id), { novaNota: 8.5, justificativa, tipo: 'PARES' })
      .expect(200);
    expect(adjusted.body as AdjustmentResponseBody).toMatchObject({
      alunoId: peerStudent.id,
      notaOriginal: 7.6,
      notaVigente: 8.5,
      ajuste: {
        valorAnterior: 7.6,
        valorNovo: 8.5,
      },
    });

    // Check history reflects the immutable original score
    const history = await api(app, tutor)
      .get(`${adjustmentsPath(peerStudent.id)}?tipo=PARES`)
      .expect(200);
    expect(history.body as HistoryBody).toMatchObject({
      notaOriginal: 7.6,
      notaVigente: 8.5,
    });
  });

  it('requires exactly one adjustment target in the database', async () => {
    await expect(
      db.query(
        `INSERT INTO grade_adjustments (previous_value, new_value, justification, created_by)
         VALUES (7, 8, $1, $2);`,
        [justificativa, tutor.id],
      ),
    ).rejects.toThrow(/ck_grade_adjustments_target/);
  });
});
