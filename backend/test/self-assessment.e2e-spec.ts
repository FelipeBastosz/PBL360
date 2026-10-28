import type { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { UserType } from '@/users/domain/enums/user-type.enum';
import { createTestApp } from './helpers/create-test-app';
import { api, cleanDatabase, insertUser, type TestUser } from './helpers/fixtures';

interface SelfAssessmentBody {
  status: string;
  notaConsolidada?: number;
  criterios: { id: string; nome: string; peso: number; notaMaxima: number }[];
  itens: { criterioId: string; nota: number }[];
}

interface StudentEvaluationSummaryBody {
  autoavaliacao: { liberada: boolean; status: string };
  feedback: { disponivel: boolean; novo: boolean };
}

interface ErrorBody {
  message: string;
}

describe('Student self-assessment (e2e)', () => {
  let app: INestApplication;
  let db: DataSource;
  let tutor: TestUser;
  let student: TestUser;
  let absentStudent: TestUser;
  let sessionId: string;
  let problemId: string;
  let firstCriterionId: string;
  let secondCriterionId: string;

  const summaryPath = () => `/sessoes/${sessionId}/minhas-avaliacoes`;
  const assessmentPath = () => `/sessoes/${sessionId}/autoavaliacao`;
  const feedbackPath = () => `/sessoes/${sessionId}/meu-feedback`;
  const items = (first = 7, second = 9) => [
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
    tutor = await insertUser(app, db, 'self-tutor@uefs.br');
    student = await insertUser(app, db, 'self-student@discente.uefs.br', UserType.STUDENT);
    absentStudent = await insertUser(app, db, 'absent-student@discente.uefs.br', UserType.STUDENT);
    const [room] = await db.query<[{ id: string }]>(
      `INSERT INTO rooms (tutor_id, name, course_code, room_code, semester, active)
       VALUES ($1, 'Sala autoavaliação', 'EXA123', 'SELF1234', '2026.2', true)
       RETURNING id;`,
      [tutor.id],
    );
    await db.query(`INSERT INTO room_tutors (room_id, tutor_id) VALUES ($1, $2);`, [
      room.id,
      tutor.id,
    ]);
    await db.query('INSERT INTO room_students (room_id, student_id) VALUES ($1, $2), ($1, $3);', [
      room.id,
      student.id,
      absentStudent.id,
    ]);
    const [table] = await db.query<[{ id: string }]>(
      `INSERT INTO performance_tables (tutor_id, name, is_default)
       VALUES ($1, 'Tabela da autoavaliação', FALSE) RETURNING id;`,
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
    problemId = problem.id;
    const [session] = await db.query<[{ id: string }]>(
      `INSERT INTO sessions (
         problem_id, performance_table_id, title, date, order_index, status,
         self_eval_released, self_eval_deadline
       ) VALUES ($1, $2, 'Sessão avaliada', '2026-10-05', 1, 'agendada', true, '2099-10-05')
       RETURNING id;`,
      [problemId, table.id],
    );
    sessionId = session.id;
    await db.query(
      `INSERT INTO attendances (session_id, student_id, recorded_by, status)
       VALUES ($1, $2, $3, 'PRESENT'), ($1, $4, $3, 'ABSENT');`,
      [sessionId, student.id, tutor.id, absentStudent.id],
    );
  });

  it('serves the summary, assessment form, and draft/submission workflow', async () => {
    const summary = await api(app, student).get(summaryPath()).expect(200);
    expect(summary.body as StudentEvaluationSummaryBody).toMatchObject({
      autoavaliacao: { liberada: true, status: 'PENDENTE' },
      feedback: { disponivel: false, novo: false },
    });

    const form = await api(app, student).get(assessmentPath()).expect(200);
    const formBody = form.body as SelfAssessmentBody;
    expect(formBody.status).toBe('PENDENTE');
    expect(formBody.criterios).toEqual(
      expect.arrayContaining([
        { id: firstCriterionId, nome: 'Participação', peso: 1, notaMaxima: 10 },
      ]),
    );
    expect(formBody.itens).toEqual([]);

    const draft = await api(app, student)
      .put(assessmentPath(), { itens: items(6, 8), enviar: false })
      .expect(200);
    expect(draft.body as SelfAssessmentBody).toMatchObject({ status: 'RASCUNHO' });

    const submitted = await api(app, student)
      .put(assessmentPath(), { itens: items(7, 9), enviar: true })
      .expect(200);
    expect(submitted.body as SelfAssessmentBody).toMatchObject({
      status: 'ENVIADA',
      notaConsolidada: 8.5,
    });
    await api(app, student).put(assessmentPath(), { itens: items(), enviar: true }).expect(409);
  });

  it('rejects absent students, disabled releases, expired deadlines, and incomplete submissions', async () => {
    await api(app, absentStudent)
      .put(assessmentPath(), { itens: items(), enviar: true })
      .expect(423);

    await db.query(
      "UPDATE attendances SET status = 'EXCUSED' WHERE session_id = $1 AND student_id = $2;",
      [sessionId, absentStudent.id],
    );
    await api(app, absentStudent)
      .put(assessmentPath(), { itens: items(), enviar: true })
      .expect(423);

    await db.query('UPDATE sessions SET self_eval_released = FALSE WHERE id = $1;', [sessionId]);
    await api(app, student).put(assessmentPath(), { itens: items(), enviar: true }).expect(423);

    await db.query(
      'UPDATE sessions SET self_eval_released = TRUE, self_eval_deadline = $2 WHERE id = $1;',
      [sessionId, new Date(Date.now() - 60_000)],
    );
    await api(app, student).put(assessmentPath(), { itens: items(), enviar: true }).expect(423);

    await db.query('UPDATE sessions SET self_eval_deadline = NULL WHERE id = $1;', [sessionId]);
    await api(app, student)
      .put(assessmentPath(), { itens: items().slice(0, 1), enviar: true })
      .expect(422);
  });

  it('rejects tutor evaluation while self-assessment is active in the session', async () => {
    const res = await api(app, tutor)
      .put(`/sessoes/${sessionId}/avaliacoes/${student.id}`, { itens: items(), enviar: true })
      .expect(409);
    expect((res.body as ErrorBody).message).toBe(
      'A avaliação direta do tutor está bloqueada enquanto a autoavaliação ou pares estiver ativa na sessão.',
    );
  });

  it('marks feedback new until the student opens it, then new again after an edit', async () => {
    await db.query('UPDATE sessions SET self_eval_released = FALSE WHERE id = $1;', [sessionId]);
    await api(app, tutor)
      .put(`/sessoes/${sessionId}/avaliacoes/${student.id}`, { itens: items(), enviar: true })
      .expect(200);
    await db.query(
      `INSERT INTO feedback (autor_id, problema_id, destinatario_id, sessao_id, escopo, texto)
       VALUES ($1, $2, $3, $4, 'SESSAO', 'Boa participação.');`,
      [tutor.id, problemId, student.id, sessionId],
    );

    const firstSummary = await api(app, student).get(summaryPath()).expect(200);
    expect((firstSummary.body as StudentEvaluationSummaryBody).feedback).toMatchObject({
      disponivel: true,
      novo: true,
    });

    const feedback = await api(app, student).get(feedbackPath()).expect(200);
    expect(feedback.body).toMatchObject({
      autor: { id: tutor.id },
      texto: 'Boa participação.',
      novo: true,
    });

    const readSummary = await api(app, student).get(summaryPath()).expect(200);
    expect((readSummary.body as StudentEvaluationSummaryBody).feedback).toMatchObject({
      disponivel: true,
      novo: false,
    });

    await db.query(
      `UPDATE feedback SET texto = 'Feedback revisado.', editado_em = now() + interval '1 second'
       WHERE sessao_id = $1 AND destinatario_id = $2 AND escopo = 'SESSAO';`,
      [sessionId, student.id],
    );
    const editedSummary = await api(app, student).get(summaryPath()).expect(200);
    expect((editedSummary.body as StudentEvaluationSummaryBody).feedback).toMatchObject({
      disponivel: true,
      novo: true,
    });
  });

  it('restricts self-assessment and own feedback endpoints to students', async () => {
    await api(app, tutor).get(assessmentPath()).expect(403);
    await api(app, tutor).get(feedbackPath()).expect(403);
  });
});
