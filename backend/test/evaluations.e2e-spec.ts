import { randomUUID } from 'node:crypto';
import type { INestApplication } from '@nestjs/common';
import type { OpenAPIObject } from '@nestjs/swagger';
import { DataSource } from 'typeorm';
import { UserType } from '@/users/domain/enums/user-type.enum';
import { createTestApp } from './helpers/create-test-app';
import { api, cleanDatabase, insertUser, type TestUser } from './helpers/fixtures';

interface EvaluationBody {
  status: string;
  enviadaEm: string | null;
  notaSessao: number | null;
  adicionalAplicado: number | null;
  configuracaoFixada: boolean;
  itens: { criterioId: string; nota: number }[];
  criterios: { id: string; nome: string; peso: number; notaMaxima: number }[];
  ajustes: {
    criterioId: string;
    valorAnterior: number;
    valorNovo: number;
    justificativa: string;
    autor: { id: string };
  }[];
}
interface SummaryBody {
  alunoId: string;
  status: string;
  notaSessao: number | null;
  presenca: null;
}

describe('Tutor evaluations (e2e)', () => {
  let app: INestApplication;
  let db: DataSource;
  let owner: TestUser,
    coTutor: TestUser,
    outsider: TestUser,
    student: TestUser,
    secondStudent: TestUser;
  let roomId: string, problemId: string, sessionId: string, nextSessionId: string, tableId: string;
  let firstCriterionId: string, secondCriterionId: string;
  const problemPath = () => `/salas/${roomId}/problemas/${problemId}`;
  const evaluationPath = (learner = student.id, session = sessionId) =>
    `/sessoes/${session}/avaliacoes/${learner}`;
  const scores = (first = 7, second = 9) => [
    { criterioId: firstCriterionId, nota: first },
    { criterioId: secondCriterionId, nota: second },
  ];
  const save = (body: object, author = owner, learner = student.id, session = sessionId) =>
    api(app, author).put(evaluationPath(learner, session), body);
  const submit = () => save({ itens: scores(), enviar: true });
  const count = async (
    table: 'evaluations' | 'evaluation_items' | 'grade_adjustments' | 'session_evaluation_configs',
  ) => {
    const [row] = await db.query<[{ count: string }]>(`SELECT COUNT(*) AS count FROM ${table};`);
    return Number(row.count);
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
    owner = await insertUser(app, db, 'owner@uefs.br');
    coTutor = await insertUser(app, db, 'cotutor@uefs.br');
    outsider = await insertUser(app, db, 'outsider@uefs.br');
    student = await insertUser(app, db, 'student1@discente.uefs.br', UserType.STUDENT);
    secondStudent = await insertUser(app, db, 'student2@discente.uefs.br', UserType.STUDENT);
    const [room] = await db.query<[{ id: string }]>(
      `INSERT INTO rooms (tutor_id, name, course_code, room_code, semester, active)
       VALUES ($1, 'Sala', 'EXA123', 'EVAL1234', '2026.2', true) RETURNING id;`,
      [owner.id],
    );
    roomId = room.id;
    await db.query('INSERT INTO room_tutors (room_id, tutor_id) VALUES ($1, $2);', [
      roomId,
      coTutor.id,
    ]);
    await db.query('INSERT INTO room_students (room_id, student_id) VALUES ($1, $2), ($1, $3);', [
      roomId,
      student.id,
      secondStudent.id,
    ]);
    const [table] = await db.query<[{ id: string }]>(
      "INSERT INTO performance_tables (tutor_id, name, is_default) VALUES ($1, 'Critérios', FALSE) RETURNING id;",
      [owner.id],
    );
    tableId = table.id;
    const criteria = await db.query<{ id: string }[]>(
      `INSERT INTO performance_criteria (performance_table_id, name, order_index, weight)
       VALUES ($1, 'Participação', 1, 1), ($1, 'Autonomia', 2, 3) RETURNING id;`,
      [tableId],
    );
    firstCriterionId = criteria[0]!.id;
    secondCriterionId = criteria[1]!.id;
    const [problem] = await db.query<[{ id: string }]>(
      `INSERT INTO problems (room_id, title, order_index, created_by)
       VALUES ($1, 'Problema', 1, $2) RETURNING id;`,
      [roomId, owner.id],
    );
    problemId = problem.id;
    const sessions = await db.query<{ id: string }[]>(
      `INSERT INTO sessions (problem_id, performance_table_id, title, date, order_index, status)
       VALUES ($1, $2, 'Primeira', '2099-10-05', 1, 'agendada'), ($1, $2, 'Segunda', '2099-10-06', 2, 'agendada') RETURNING id;`,
      [problemId, tableId],
    );
    sessionId = sessions[0]!.id;
    nextSessionId = sessions[1]!.id;
  });

  it('returns pending students and criteria without writing a draft or freezing the session', async () => {
    const criteria = await api(app, coTutor).get(`${problemPath()}/criterios`).expect(200);
    expect((criteria.body as EvaluationBody).criterios).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: firstCriterionId, peso: 1, notaMaxima: 10 }),
      ]),
    );
    const detail = await api(app, coTutor).get(evaluationPath()).expect(200);
    expect(detail.body as EvaluationBody).toMatchObject({
      status: 'PENDENTE',
      itens: [],
      configuracaoFixada: false,
    });
    const list = await api(app, owner).get(`/sessoes/${sessionId}/avaliacoes`).expect(200);
    expect(list.body as SummaryBody[]).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          alunoId: student.id,
          status: 'PENDENTE',
          presenca: null,
          notaSessao: null,
        }),
      ]),
    );
    expect(await count('evaluations')).toBe(0);
    expect(await count('session_evaluation_configs')).toBe(0);
  });
  it('lets another room tutor submit the simple grade when no cargo is assigned', async () => {
    await save({ itens: scores().slice(0, 1), enviar: false }).expect(200);
    const response = await save({ itens: scores(), enviar: true }, coTutor).expect(200);
    expect(response.body as EvaluationBody).toMatchObject({
      status: 'ENVIADA',
      notaSessao: 8.5,
      adicionalAplicado: null,
    });
    expect(await count('evaluations')).toBe(1);
    const list = await api(app, owner).get(`/sessoes/${sessionId}/avaliacoes`).expect(200);
    expect((list.body as SummaryBody[]).find((row) => row.alunoId === student.id)).toMatchObject({
      status: 'ENVIADA',
      notaSessao: 8.5,
    });
  });
  it('replaces a draft item list and permits an empty draft', async () => {
    await save({ itens: scores(), enviar: false }).expect(200);
    const response = await save({ itens: [], enviar: false }).expect(200);
    expect(response.body as EvaluationBody).toMatchObject({
      status: 'RASCUNHO',
      itens: [],
      notaSessao: null,
    });
    expect(await count('evaluation_items')).toBe(0);
  });
  it('rolls back invalid first saves without leaving an evaluation or snapshot', async () => {
    await save({ itens: scores().slice(0, 1), enviar: true }).expect(422);
    await save({ itens: [{ criterioId: randomUUID(), nota: 8 }], enviar: false }).expect(422);
    await save({ itens: scores(10.01), enviar: true }).expect(422);
    await save({ itens: [scores()[0], scores()[0]], enviar: false }).expect(422);
    expect(await count('evaluations')).toBe(0);
    expect(await count('session_evaluation_configs')).toBe(0);
  });
  it('requires justification, audits every changed score and preserves item ids', async () => {
    await submit().expect(200);
    const before = await db.query<{ id: string }[]>('SELECT id FROM evaluation_items ORDER BY id;');
    await save({ itens: scores(8, 10), enviar: true }, coTutor).expect(400);
    const unchanged = await api(app, owner).get(evaluationPath()).expect(200);
    expect((unchanged.body as EvaluationBody).notaSessao).toBe(8.5);
    expect(await count('grade_adjustments')).toBe(0);
    const response = await save(
      { itens: scores(8, 10), enviar: true, justificativa: 'Revisão após discussão da sessão' },
      coTutor,
    ).expect(200);
    const body = response.body as EvaluationBody;
    expect(body.notaSessao).toBe(9.5);
    expect(body.ajustes).toHaveLength(2);
    expect(body.ajustes.every((adjustment) => adjustment.autor.id === coTutor.id)).toBe(true);
    expect(body.ajustes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          criterioId: firstCriterionId,
          valorAnterior: 7,
          valorNovo: 8,
        }),
      ]),
    );
    expect(
      await db.query<{ id: string }[]>('SELECT id FROM evaluation_items ORDER BY id;'),
    ).toEqual(before);
    await save({ itens: scores(8, 10), enviar: true }, coTutor).expect(200);
    expect(await count('grade_adjustments')).toBe(2);
    await save({ itens: scores(), enviar: false }).expect(400);
  });
  it('uses the frozen session criteria for every student and current criteria in a new session', async () => {
    await save({ itens: [], enviar: false }).expect(200);
    await api(app, owner)
      .put(`/tabelas-desempenho/${tableId}`, {
        nome: 'Atualizada',
        criterios: [
          {
            id: firstCriterionId,
            nome: 'Participação revisada',
            descricao: null,
            peso: 10,
            ordem: 1,
          },
        ],
      })
      .expect(200);
    await save({ itens: scores(), enviar: true }, coTutor, secondStudent.id).expect(200);
    const old = await api(app, owner).get(evaluationPath(secondStudent.id)).expect(200);
    expect((old.body as EvaluationBody).criterios).toHaveLength(2);
    expect((old.body as EvaluationBody).notaSessao).toBe(8.5);
    expect((old.body as EvaluationBody).criterios[0]).toMatchObject({
      nome: 'Participação',
      peso: 1,
    });
    const next = await save(
      { itens: [{ criterioId: firstCriterionId, nota: 7 }], enviar: true },
      owner,
      student.id,
      nextSessionId,
    ).expect(200);
    expect((next.body as EvaluationBody).criterios).toHaveLength(1);
    expect((next.body as EvaluationBody).criterios[0]).toMatchObject({
      nome: 'Participação revisada',
      peso: 10,
    });
    expect((next.body as EvaluationBody).notaSessao).toBe(7);
  });
  it('applies the current role bonus at submission and preserves it during adjustments', async () => {
    await api(app, owner)
      .put(`/sessoes/${sessionId}/papeis/${student.id}`, {
        papel: 'COORDENADOR',
        notaAdicional: 0.5,
      })
      .expect(200);
    const sent = await submit().expect(200);
    expect((sent.body as EvaluationBody).notaSessao).toBe(7.45);
    await api(app, owner)
      .put(`/sessoes/${sessionId}/papeis/${student.id}`, { papel: 'COORDENADOR', notaAdicional: 1 })
      .expect(200);
    const adjusted = await save({
      itens: scores(8, 9),
      enviar: true,
      justificativa: 'Correção da participação',
    }).expect(200);
    expect(adjusted.body as EvaluationBody).toMatchObject({
      notaSessao: 7.63,
      adicionalAplicado: 0.5,
      enviadaEm: (sent.body as EvaluationBody).enviadaEm,
    });
  });
  it('blocks table replacement and session deletion after a submitted evaluation', async () => {
    await submit().expect(200);
    await api(app, owner).put(`/sessoes/${sessionId}/tabela`, { tabelaId: tableId }).expect(409);
    await api(app, owner).put(problemPath(), { title: 'Atualizado' }).expect(200);
    const sessionPath = `${problemPath()}/sessoes/${sessionId}`;
    const impact = await api(app, owner).get(`${sessionPath}/impacto-exclusao`).expect(200);
    expect(impact.body as { avaliacoes: number }).toMatchObject({ avaliacoes: 1 });
    await api(app, owner).delete(sessionPath).expect(409);
  });
  it('rejects an unavailable table for a session without changing its evaluation configuration', async () => {
    await api(app, owner)
      .put(`/sessoes/${sessionId}/tabela`, {
        tabelaId: '00000000-0000-4000-8000-000000000000',
      })
      .expect(422);
    await submit().expect(200);
  });
  it('does not allow students, outsiders or unauthenticated callers to access evaluations', async () => {
    await api(app).get(evaluationPath()).expect(401);
    await api(app, outsider).get(evaluationPath()).expect(403);
    await api(app, student).get(evaluationPath()).expect(403);
    await save({ itens: scores(), enviar: true }, outsider).expect(403);
    const unregistered = await insertUser(
      app,
      db,
      'outsider-student@discente.uefs.br',
      UserType.STUDENT,
    );
    await save({ itens: scores(), enviar: true }, owner, unregistered.id).expect(422);
    expect(await count('evaluations')).toBe(0);
  });
  it('serializes simultaneous initial saves into one shared evaluation and snapshot', async () => {
    const responses = await Promise.all([
      save({ itens: scores(), enviar: false }),
      save({ itens: scores(), enviar: false }, coTutor),
    ]);
    expect(responses.map((response) => response.status)).toEqual([200, 200]);
    expect(await count('evaluations')).toBe(1);
    expect(await count('session_evaluation_configs')).toBe(1);
    expect(await count('evaluation_items')).toBe(2);
  });
  it('allows zero-weight drafts but refuses submission without changing the draft', async () => {
    await db.query('UPDATE performance_criteria SET weight = 0 WHERE performance_table_id = $1;', [
      tableId,
    ]);
    await save({ itens: scores(), enviar: false }).expect(200);
    await submit().expect(422);
    const response = await api(app, owner).get(evaluationPath()).expect(200);
    expect(response.body as EvaluationBody).toMatchObject({ status: 'RASCUNHO', notaSessao: null });
  });
  it('rolls back score changes and audit rows together if item persistence fails', async () => {
    await submit().expect(200);
    await db.query(
      'ALTER TABLE evaluation_items ADD CONSTRAINT test_reject_score CHECK (score <> 9.75);',
    );
    try {
      await save({
        itens: scores(9.75, 9),
        enviar: true,
        justificativa: 'Ajuste para testar a transação',
      }).expect(500);
      const response = await api(app, owner).get(evaluationPath()).expect(200);
      const body = response.body as EvaluationBody;
      expect(body.notaSessao).toBe(8.5);
      expect(body.itens.find((item) => item.criterioId === firstCriterionId)?.nota).toBe(7);
      expect(body.ajustes).toEqual([]);
    } finally {
      await db.query('ALTER TABLE evaluation_items DROP CONSTRAINT test_reject_score;');
    }
  });
  it('serializes changing the session table against the first evaluation', async () => {
    const [evaluation, configuration] = await Promise.all([
      save({ itens: [], enviar: false }),
      api(app, owner).put(`/sessoes/${sessionId}/tabela`, { tabelaId: tableId }),
    ]);
    expect(evaluation.status).toBe(200);
    expect(configuration.status).toBe(200);
    expect(await count('evaluations')).toBe(1);
  });
  it('documents all routes, request fields and business error responses', async () => {
    const response = await api(app).get('/docs/json').expect(200);
    const document = response.body as OpenAPIObject;
    const base = '/api/sessoes/{sessionId}/avaliacoes';
    const item = `${base}/{studentId}`;
    expect(document.paths[base]?.get?.responses['200']).toBeDefined();
    expect(document.paths[item]?.get?.responses['200']).toBeDefined();
    expect(document.paths[item]?.put?.responses['400']).toBeDefined();
    expect(document.paths[item]?.put?.responses['422']).toBeDefined();
    expect(
      document.paths['/api/salas/{roomId}/problemas/{problemId}/criterios']?.get?.responses['422'],
    ).toBeDefined();
    expect(document.components?.schemas?.SaveTutorEvaluationDto).toMatchObject({
      required: ['itens', 'enviar'],
    });
    expect(document.components?.schemas?.TutorEvaluationResponseDto).toHaveProperty(
      'properties.criterios',
    );
  });
  it('reads submitted evaluations in the grade report and preserves an absent cargo score', async () => {
    await submit().expect(200);
    await db.query(
      `INSERT INTO criterion_grades (session_id, student_id, criterion_id, score)
      VALUES ($1, $2, $3, 0), ($1, $2, $4, 0);`,
      [sessionId, student.id, firstCriterionId, secondCriterionId],
    );
    await api(app, owner)
      .put(`/sessoes/${sessionId}/papeis/${student.id}`, { papel: 'COORDENADOR', notaAdicional: 1 })
      .expect(200);
    const response = await api(app, owner).get(`${problemPath()}/notas`).expect(200);
    const body = response.body as {
      alunos: { alunoId: string; sessoes: { sessaoId: string; nota: number | null }[] }[];
    };
    expect(
      body.alunos
        .find((row) => row.alunoId === student.id)
        ?.sessoes.find((row) => row.sessaoId === sessionId)?.nota,
    ).toBe(8.5);
  });

  it('does not expose legacy scores as submitted grades while a tutor evaluation is a draft', async () => {
    await save({ itens: scores(), enviar: false }).expect(200);
    await db.query(
      `INSERT INTO criterion_grades (session_id, student_id, criterion_id, score)
      VALUES ($1, $2, $3, 10), ($1, $2, $4, 10);`,
      [sessionId, student.id, firstCriterionId, secondCriterionId],
    );
    const response = await api(app, owner).get(`${problemPath()}/notas`).expect(200);
    const body = response.body as {
      alunos: { alunoId: string; sessoes: { sessaoId: string; nota: number | null }[] }[];
    };
    expect(
      body.alunos
        .find((row) => row.alunoId === student.id)
        ?.sessoes.find((row) => row.sessaoId === sessionId)?.nota,
    ).toBeNull();
  });

  it('serializes a submitted adjustment with propagation of new weights', async () => {
    await submit().expect(200);
    const responses = await Promise.all([
      save({ itens: scores(8, 9), enviar: true, justificativa: 'Revisão da participação' }),
      api(app, owner).put(`/tabelas-desempenho/${tableId}`, {
        nome: 'Critérios',
        propagarParaSessoes: true,
        criterios: [
          { id: firstCriterionId, nome: 'Participação', peso: 6, ordem: 1 },
          { id: secondCriterionId, nome: 'Autonomia', peso: 4, ordem: 2 },
        ],
      }),
    ]);
    expect(responses.map((response) => response.status)).toEqual([200, 200]);
    const response = await api(app, owner).get(evaluationPath()).expect(200);
    expect((response.body as EvaluationBody).notaSessao).toBe(8.4);
    expect((response.body as EvaluationBody).ajustes).toHaveLength(1);
  });

  it('rejects propagating missing criteria into a submitted future-session evaluation', async () => {
    await db.query('UPDATE sessions SET date = CURRENT_DATE + 10 WHERE problem_id = $1;', [
      problemId,
    ]);
    await submit().expect(200);
    await api(app, owner)
      .put(`/tabelas-desempenho/${tableId}`, {
        nome: 'Critérios',
        propagarParaSessoes: true,
        criterios: [
          { id: firstCriterionId, nome: 'Participação', peso: 5, ordem: 1 },
          { nome: 'Novo critério', peso: 5, ordem: 2 },
        ],
      })
      .expect(409);
    const response = await api(app, owner).get(evaluationPath()).expect(200);
    expect((response.body as EvaluationBody).notaSessao).toBe(8.5);
    expect((response.body as EvaluationBody).criterios.map((criterion) => criterion.id)).toEqual([
      firstCriterionId,
      secondCriterionId,
    ]);
    const current = await api(app, owner).get(`${problemPath()}/criterios`).expect(200);
    expect((current.body as EvaluationBody).criterios.map((criterion) => criterion.id)).toEqual([
      firstCriterionId,
      secondCriterionId,
    ]);
  });

  it('removes obsolete draft items when propagating structural edits to a future session', async () => {
    await db.query('UPDATE sessions SET date = CURRENT_DATE + 10 WHERE problem_id = $1;', [
      problemId,
    ]);
    await save({ itens: scores(), enviar: false }).expect(200);
    await api(app, owner)
      .put(`/tabelas-desempenho/${tableId}`, {
        nome: 'Critérios',
        propagarParaSessoes: true,
        criterios: [{ id: firstCriterionId, nome: 'Participação', peso: 10, ordem: 1 }],
      })
      .expect(200);
    const response = await api(app, owner).get(evaluationPath()).expect(200);
    expect((response.body as EvaluationBody).itens).toEqual([
      { criterioId: firstCriterionId, nota: 7 },
    ]);
    await save({ itens: [{ criterioId: firstCriterionId, nota: 7 }], enviar: true }).expect(200);
  });
});
