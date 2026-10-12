import { randomUUID } from 'node:crypto';
import type { INestApplication } from '@nestjs/common';
import type { OpenAPIObject } from '@nestjs/swagger';
import { DataSource } from 'typeorm';
import { SESSION_CALCULATION_VERSION } from '@/evaluations/domain/services/session-grade-calculator';
import { UserType } from '@/users/domain/enums/user-type.enum';
import { createTestApp } from './helpers/create-test-app';
import { api, cleanDatabase, insertUser, type TestUser } from './helpers/fixtures';

interface FeedbackBody {
  id: string;
  autor: { id: string; nome: string };
  texto: string;
  criadoEm: string;
  editadoEm: string | null;
  novo: boolean;
  nota?: number | null;
}
interface ProblemBody {
  individual: FeedbackBody | null;
  geral: FeedbackBody | null;
  sessoes: { sessaoId: string; rotulo: string; data: string; feedback: FeedbackBody | null }[];
}

describe('Received feedbacks (e2e)', () => {
  let app: INestApplication, db: DataSource;
  let tutor: TestUser, student: TestUser, colleague: TestUser, outsider: TestUser;
  let roomId: string,
    problemId: string,
    sessionId: string,
    laterSessionId: string,
    criterionId: string,
    tableId: string;
  const sessionPath = () => `/sessoes/${sessionId}/meu-feedback`;
  const problemPath = () => `/salas/${roomId}/problemas/${problemId}/meus-feedbacks`;
  const views = () =>
    db.query<{ feedback_id: string; student_id: string; first_viewed_at: Date }[]>(
      'SELECT * FROM feedback_views ORDER BY feedback_id, student_id;',
    );
  // Feedback visibility depends on persisted evaluation status, not the table assignment workflow.
  const createEvaluation = async (learner = student, submit = true) => {
    await db.transaction(async (manager) => {
      await manager.query(
        `INSERT INTO session_evaluation_configs (session_id, performance_table_id, table_name, created_by)
         VALUES ($1, $2, 'Tabela', $3) ON CONFLICT (session_id) DO NOTHING;`,
        [sessionId, tableId, tutor.id],
      );
      await manager.query(
        `INSERT INTO session_evaluation_criteria (session_id, criterion_id, name, weight, order_index)
         VALUES ($1, $2, 'Participação', 10, 1) ON CONFLICT (session_id, criterion_id) DO NOTHING;`,
        [sessionId, criterionId],
      );
      const [evaluation] = await manager.query<[{ id: string }]>(
        `INSERT INTO evaluations (evaluator_id, student_id, problem_id, session_id, config_session_id,
          performance_table_id, type, status, submitted_at, session_score, calculation_version, created_by)
         VALUES ($1, $2, $3, $4, $4, $5, 'TUTOR_SESSION', $6, $7, $8, $9, $1) RETURNING id;`,
        [
          tutor.id,
          learner.id,
          problemId,
          sessionId,
          tableId,
          submit ? 'SUBMITTED' : 'DRAFT',
          submit ? new Date() : null,
          submit ? 8 : null,
          submit ? SESSION_CALCULATION_VERSION : null,
        ],
      );
      await manager.query(
        'INSERT INTO evaluation_items (evaluation_id, criterion_id, score) VALUES ($1, $2, 8);',
        [evaluation.id, criterionId],
      );
    });
  };
  const feedback = async (
    scope: 'ALUNO' | 'SESSAO' | 'PROBLEMA',
    learner = student,
    score: number | null = null,
  ) => {
    const [row] = await db.query<[{ id: string }]>(
      `INSERT INTO feedback (autor_id, problema_id, destinatario_id, sessao_id, escopo, texto, nota)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id;`,
      [
        tutor.id,
        problemId,
        scope === 'PROBLEMA' ? null : learner.id,
        scope === 'SESSAO' ? sessionId : null,
        scope,
        `Feedback ${scope} ${learner.id}`,
        score,
      ],
    );
    return row.id;
  };
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
    tutor = await insertUser(app, db, 'tutor@uefs.br');
    student = await insertUser(app, db, 'student1@discente.uefs.br', UserType.STUDENT);
    colleague = await insertUser(app, db, 'student2@discente.uefs.br', UserType.STUDENT);
    outsider = await insertUser(app, db, 'outsider@discente.uefs.br', UserType.STUDENT);
    const [room] = await db.query<[{ id: string }]>(
      `INSERT INTO rooms (tutor_id, name, course_code, room_code, semester, active)
       VALUES ($1, 'Sala', 'EXA123', 'FEED1234', '2026.2', true) RETURNING id;`,
      [tutor.id],
    );
    roomId = room.id;
    await db.query('INSERT INTO room_students (room_id, student_id) VALUES ($1, $2), ($1, $3);', [
      roomId,
      student.id,
      colleague.id,
    ]);
    // Session creation can assign the tutor's default table automatically.
    const [table] = await db.query<[{ id: string }]>(
      "INSERT INTO performance_tables (tutor_id, name, is_default) VALUES ($1, 'Tabela', true) RETURNING id;",
      [tutor.id],
    );
    tableId = table.id;
    const [criterion] = await db.query<[{ id: string }]>(
      "INSERT INTO performance_criteria (performance_table_id, name, weight, order_index) VALUES ($1, 'Participação', 10, 1) RETURNING id;",
      [table.id],
    );
    criterionId = criterion.id;
    const [problem] = await db.query<[{ id: string }]>(
      "INSERT INTO problems (room_id, title, order_index, created_by) VALUES ($1, 'Problema', 1, $2) RETURNING id;",
      [roomId, tutor.id],
    );
    problemId = problem.id;
    const sessions = await db.query<{ id: string }[]>(
      `INSERT INTO sessions (problem_id, title, date, order_index, status)
       VALUES ($1, 'Posterior', '2099-10-20', 1, 'agendada'), ($1, 'Anterior', '2099-10-10', 2, 'agendada') RETURNING id;`,
      [problemId],
    );
    laterSessionId = sessions[0]!.id;
    sessionId = sessions[1]!.id;
  });

  it('returns JSON null and does not record a view before submission', async () => {
    const empty = await api(app, student).get(sessionPath()).expect(200);
    expect(empty.text).toBe('null');
    await feedback('SESSAO');
    await createEvaluation(student, false);
    const draft = await api(app, student).get(sessionPath()).expect(200);
    expect(draft.body).toBeNull();
    const problem = await api(app, student).get(problemPath()).expect(200);
    expect((problem.body as ProblemBody).sessoes.every((item) => item.feedback === null)).toBe(
      true,
    );
    expect(await views()).toHaveLength(0);
  });

  it('returns an identified tutor, hides scores and shares the first read across both endpoints', async () => {
    const id = await feedback('SESSAO', student, 9);
    await createEvaluation();
    const first = await api(app, student).get(sessionPath()).expect(200);
    expect(first.headers['cache-control']).toBe('private, no-store');
    expect(first.body as FeedbackBody).toMatchObject({
      id,
      autor: { id: tutor.id, nome: 'Usuário de Teste' },
      novo: true,
      editadoEm: null,
    });
    expect(Object.keys(first.body as FeedbackBody).sort()).toEqual([
      'autor',
      'criadoEm',
      'editadoEm',
      'id',
      'novo',
      'texto',
    ]);
    const originalViews = await views();
    const all = await api(app, student).get(problemPath()).expect(200);
    expect((all.body as ProblemBody).sessoes[0]?.feedback?.novo).toBe(false);
    await api(app, student).get(sessionPath()).expect(200);
    expect(await views()).toEqual(originalViews);
  });

  it('shows individual and general feedback immediately and marks only visible feedbacks', async () => {
    const individualId = await feedback('ALUNO', student, 0);
    const generalId = await feedback('PROBLEMA');
    await feedback('SESSAO');
    const response = await api(app, student).get(problemPath()).expect(200);
    const body = response.body as ProblemBody;
    expect(body.individual).toMatchObject({
      id: individualId,
      nota: 0,
      novo: true,
      autor: { id: tutor.id },
    });
    expect(body.geral).toMatchObject({ id: generalId, novo: true });
    expect(body.geral).not.toHaveProperty('nota');
    expect(body.sessoes.map((item) => item.sessaoId)).toEqual([sessionId, laterSessionId]);
    expect(body.sessoes[0]).toMatchObject({
      rotulo: 'Anterior',
      data: '2099-10-10',
      feedback: null,
    });
    expect(await views()).toHaveLength(2);
    await createEvaluation();
    const visible = await api(app, student).get(problemPath()).expect(200);
    expect((visible.body as ProblemBody).sessoes[0]?.feedback?.novo).toBe(true);
    const direct = await api(app, student).get(sessionPath()).expect(200);
    expect((direct.body as FeedbackBody).novo).toBe(false);
  });

  it('never reads a colleague feedback even when their id is supplied as a query parameter', async () => {
    await feedback('ALUNO', colleague, 10);
    await feedback('SESSAO', colleague);
    await createEvaluation(colleague);
    const all = await api(app, student).get(`${problemPath()}?alunoId=${colleague.id}`).expect(200);
    expect((all.body as ProblemBody).individual).toBeNull();
    expect((all.body as ProblemBody).sessoes.every((item) => item.feedback === null)).toBe(true);
    const single = await api(app, student)
      .get(`${sessionPath()}?alunoId=${colleague.id}`)
      .expect(200);
    expect(single.body).toBeNull();
    expect(await views()).toHaveLength(0);
  });

  it('does not release own session feedback when only another student has submitted grades', async () => {
    await feedback('SESSAO');
    await createEvaluation(colleague);
    const response = await api(app, student).get(sessionPath()).expect(200);
    expect(response.body).toBeNull();
    expect(await views()).toHaveLength(0);
  });

  it('tracks general feedback independently for each enrolled student', async () => {
    const id = await feedback('PROBLEMA');
    const first = await api(app, student).get(problemPath()).expect(200);
    const second = await api(app, colleague).get(problemPath()).expect(200);
    expect((first.body as ProblemBody).geral).toMatchObject({ id, novo: true });
    expect((second.body as ProblemBody).geral).toMatchObject({ id, novo: true });
    expect((await views()).map((row) => row.student_id).sort()).toEqual(
      [student.id, colleague.id].sort(),
    );
  });

  it('records exactly one first read during concurrent requests', async () => {
    await feedback('SESSAO');
    await createEvaluation();
    const responses = await Promise.all([
      api(app, student).get(sessionPath()).expect(200),
      api(app, student).get(problemPath()).expect(200),
    ]);
    const flags = [
      (responses[0].body as FeedbackBody).novo,
      (responses[1].body as ProblemBody).sessoes[0]!.feedback!.novo,
    ];
    expect(flags.filter(Boolean)).toHaveLength(1);
    expect(await views()).toHaveLength(1);
  });

  it('keeps the first read after editing while showing the current author and text', async () => {
    const id = await feedback('ALUNO', student, 8);
    await api(app, student).get(problemPath()).expect(200);
    const originalViews = await views();
    const editor = await insertUser(app, db, 'editor@uefs.br');
    await db.query('INSERT INTO room_tutors (room_id, tutor_id) VALUES ($1, $2);', [
      roomId,
      editor.id,
    ]);
    await api(app, editor)
      .put(`/salas/${roomId}/problemas/${problemId}/feedbacks/alunos/${student.id}`, {
        texto: 'Texto atualizado pelo professor.',
        nota: 9,
      })
      .expect(200);
    const response = await api(app, student).get(problemPath()).expect(200);
    expect((response.body as ProblemBody).individual).toMatchObject({
      id,
      texto: 'Texto atualizado pelo professor.',
      nota: 9,
      novo: false,
      autor: { id: editor.id },
    });
    expect((response.body as ProblemBody).individual?.editadoEm).not.toBeNull();
    expect(await views()).toEqual(originalViews);
  });

  it('rejects unauthenticated, tutor and unenrolled requests without recording views', async () => {
    await feedback('PROBLEMA');
    for (const path of [sessionPath(), problemPath()]) {
      await api(app).get(path).expect(401);
      await api(app, tutor).get(path).expect(403);
      await api(app, outsider).get(path).expect(403);
    }
    expect(await views()).toHaveLength(0);
  });

  it('rejects a problem from a different room and unknown sessions', async () => {
    const [other] = await db.query<[{ id: string }]>(
      "INSERT INTO rooms (tutor_id, name, course_code, room_code, semester, active) VALUES ($1, 'Outra', 'EXA124', 'OTHER123', '2026.2', true) RETURNING id;",
      [tutor.id],
    );
    await db.query('INSERT INTO room_students (room_id, student_id) VALUES ($1, $2);', [
      other.id,
      student.id,
    ]);
    await api(app, student)
      .get(`/salas/${other.id}/problemas/${problemId}/meus-feedbacks`)
      .expect(404);
    await api(app, student).get(`/sessoes/${randomUUID()}/meu-feedback`).expect(404);
    await api(app, student).get('/sessoes/invalid/meu-feedback').expect(400);
    expect(await views()).toHaveLength(0);
  });

  it('returns null feedbacks and an empty array when the problem has no sessions', async () => {
    await db.query('DELETE FROM sessions WHERE problem_id = $1;', [problemId]);
    const response = await api(app, student).get(problemPath()).expect(200);
    expect(response.body as ProblemBody).toEqual({ individual: null, geral: null, sessoes: [] });
    expect(await views()).toHaveLength(0);
  });

  it('preserves an optional null individual score', async () => {
    await feedback('ALUNO');
    const response = await api(app, student).get(problemPath()).expect(200);
    expect((response.body as ProblemBody).individual?.nota).toBeNull();
  });

  it('documents both student routes and their response schemas', async () => {
    const response = await api(app).get('/docs/json').expect(200);
    const document = response.body as OpenAPIObject;
    for (const path of [
      '/api/sessoes/{sessaoId}/meu-feedback',
      '/api/salas/{salaId}/problemas/{problemaId}/meus-feedbacks',
    ]) {
      for (const status of ['200', '400', '401', '403', '404']) {
        expect(document.paths[path]?.get?.responses[status]).toBeDefined();
      }
    }
    const schemas = document.components!.schemas!;
    expect(schemas.ReceivedFeedbackResponseDto).toBeDefined();
    expect(schemas.ReceivedProblemFeedbacksResponseDto).toBeDefined();
  });
});
