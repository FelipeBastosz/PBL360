import type { INestApplication } from '@nestjs/common';
import type { OpenAPIObject } from '@nestjs/swagger';
import { DataSource } from 'typeorm';
import { UserType } from '@/users/domain/enums/user-type.enum';
import { createTestApp } from './helpers/create-test-app';
import { api, cleanDatabase, insertUser, type TestUser } from './helpers/fixtures';

interface EditResponse {
  tabela: { id: string; nome: string };
  sessoesAtualizadas: Array<{ sessaoId: string; rotulo: string }>;
}
interface EvaluationResponse {
  notaSessao: number;
  enviadaEm: string;
  criterios: Array<{ id: string; nome: string; peso: number; notaMaxima: number }>;
  itens: Array<{ criterioId: string; nota: number }>;
  ajustes: Array<{
    criterioId: string;
    valorAnterior: number;
    valorNovo: number;
    justificativa: string;
  }>;
}

describe('Session table editing (e2e)', () => {
  let app: INestApplication;
  let db: DataSource;
  let owner: TestUser, student: TestUser, outsider: TestUser;
  let roomId: string, problemId: string, tableId: string;
  let sessionId: string, nextSessionId: string, firstId: string, secondId: string;
  const path = () => `/sessoes/${sessionId}/tabela`;
  const evaluationPath = (session = sessionId) => `/sessoes/${session}/avaliacoes/${student.id}`;
  const scores = (first = 8) => [
    { criterioId: firstId, nota: first },
    { criterioId: secondId, nota: 6 },
  ];
  const criteria = () => [
    { id: firstId, nome: 'Participação', peso: 8 },
    { id: secondId, nome: 'Postura', peso: 2 },
  ];
  const edit = (body: object, user = owner) => api(app, user).put(`${path()}/edicao`, body);
  const save = (body: object, session = sessionId) =>
    api(app, owner).put(evaluationPath(session), body);

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
    owner = await insertUser(app, db, 'table-owner@uefs.br');
    outsider = await insertUser(app, db, 'table-outsider@uefs.br');
    student = await insertUser(app, db, 'table-student@discente.uefs.br', UserType.STUDENT);
    const [room] = await db.query<[{ id: string }]>(
      `INSERT INTO rooms (tutor_id, name, course_code, room_code, semester, active)
       VALUES ($1, 'Sala', 'EXA123', 'EDT12345', '2026.2', true) RETURNING id;`,
      [owner.id],
    );
    roomId = room.id;
    await db.query('INSERT INTO room_students (room_id, student_id) VALUES ($1, $2);', [
      roomId,
      student.id,
    ]);
    const [table] = await db.query<[{ id: string }]>(
      "INSERT INTO performance_tables (tutor_id, name, is_default) VALUES ($1, 'Barema', FALSE) RETURNING id;",
      [owner.id],
    );
    tableId = table.id;
    const rows = await db.query<Array<{ id: string }>>(
      `INSERT INTO performance_criteria (performance_table_id, name, order_index, weight)
       VALUES ($1, 'Participação', 1, 5), ($1, 'Postura', 2, 5) RETURNING id;`,
      [tableId],
    );
    [firstId, secondId] = [rows[0]!.id, rows[1]!.id];
    const [problem] = await db.query<[{ id: string }]>(
      "INSERT INTO problems (room_id, title, order_index, created_by) VALUES ($1, 'P1', 1, $2) RETURNING id;",
      [roomId, owner.id],
    );
    problemId = problem.id;
    const sessions = await db.query<Array<{ id: string }>>(
      `INSERT INTO sessions (problem_id, performance_table_id, title, date, order_index, status)
       VALUES ($1, $2, 'P1S1', CURRENT_DATE + 7, 1, 'agendada'),
              ($1, $2, 'P1S2', CURRENT_DATE + 8, 2, 'agendada') RETURNING id;`,
      [problemId, tableId],
    );
    [sessionId, nextSessionId] = [sessions[0]!.id, sessions[1]!.id];
  });

  it('recognizes today, past dates and submitted future evaluations, without freezing on GET', async () => {
    const permissions = () => api(app, owner).get(`${path()}/permissoes-edicao`);
    expect((await permissions().expect(200)).body).toMatchObject({
      podeEditarCriterios: true,
      motivo: null,
    });
    for (const offset of [0, -1]) {
      await db.query('UPDATE sessions SET date = CURRENT_DATE + $2::int WHERE id = $1;', [
        nextSessionId,
        offset,
      ]);
      expect((await permissions().expect(200)).body).toMatchObject({
        podeEditarCriterios: false,
        sessoesQueUsam: expect.arrayContaining([
          expect.objectContaining({ sessaoId: nextSessionId, jaAconteceu: true }),
        ]) as unknown,
      });
    }
    await db.query('UPDATE sessions SET date = CURRENT_DATE + 8 WHERE id = $1;', [nextSessionId]);
    await save({ itens: scores(), enviar: false }).expect(200);
    expect((await permissions().expect(200)).body).toMatchObject({ podeEditarCriterios: true });
    await save({ itens: scores(), enviar: true }).expect(200);
    expect((await permissions().expect(200)).body).toMatchObject({ podeEditarCriterios: false });
  });

  it.each(['SESSAO', 'TODAS'])(
    'supports full editing with %s and keeps scores between zero and ten',
    async (scope) => {
      await save({ itens: scores(), enviar: false }).expect(200);
      const updated = criteria();
      updated[0] = { id: firstId, nome: 'Autonomia', peso: 8 };
      const response = await edit({ escopo: scope, nome: 'Novo', criterios: updated }).expect(200);
      const body = response.body as EditResponse;
      expect(body.sessoesAtualizadas).toHaveLength(scope === 'SESSAO' ? 1 : 2);
      expect(body.tabela.nome).toBe(scope === 'SESSAO' ? 'Novo — P1S1' : 'Novo');
      const detail = (await api(app, owner).get(evaluationPath()).expect(200))
        .body as EvaluationResponse;
      const first = detail.criterios.find((criterion) => criterion.nome === 'Autonomia')!;
      expect(first).toMatchObject({ notaMaxima: 10, peso: 8 });
      expect(detail.itens).toEqual(
        expect.arrayContaining([expect.objectContaining({ criterioId: first.id, nota: 8 })]),
      );
      const valid = detail.itens.map((item) => ({
        ...item,
        nota: item.criterioId === first.id ? 10 : item.nota,
      }));
      for (const nota of [-0.01, 10.01]) {
        const invalid = valid.map((item) =>
          item.criterioId === first.id ? { ...item, nota } : item,
        );
        await save({ itens: invalid, enviar: true }).expect(422);
      }
      await save({ itens: valid, enviar: true }).expect(200);
      const [next] = await db.query<[{ tableId: string }]>(
        'SELECT performance_table_id AS "tableId" FROM sessions WHERE id = $1;',
        [nextSessionId],
      );
      expect(next.tableId).toBe(tableId);
      if (scope === 'SESSAO') {
        expect(body.tabela.id).not.toBe(tableId);
        const [copy] = await db.query<[{ roomId: string; isDefault: boolean }]>(
          'SELECT room_id AS "roomId", is_default AS "isDefault" FROM performance_tables WHERE id = $1;',
          [body.tabela.id],
        );
        expect(copy).toEqual({ roomId, isDefault: false });
      }
    },
  );

  it.each(['SESSAO', 'TODAS'])(
    'recalculates on read and preserves item IDs and adjustments with %s',
    async (scope) => {
      await save({ itens: scores(), enviar: true }).expect(200);
      await save({ itens: scores(), enviar: true }, nextSessionId).expect(200);
      const adjusted = (
        await save({
          itens: scores(9),
          enviar: true,
          justificativa: 'Revisão da participação',
        }).expect(200)
      ).body as EvaluationResponse;
      const before = await db.query<Array<{ id: string; score: string }>>(
        `SELECT ei.id, ei.score FROM evaluation_items ei JOIN evaluations e ON e.id = ei.evaluation_id
        WHERE e.session_id = $1 ORDER BY ei.id;`,
        [sessionId],
      );
      await edit({ escopo: scope, criterios: criteria() }).expect(200);
      const after = (await api(app, owner).get(evaluationPath()).expect(200))
        .body as EvaluationResponse;
      expect(after.notaSessao).toBe(8.4);
      expect(after.enviadaEm).toBe(adjusted.enviadaEm);
      expect(after.ajustes).toEqual([
        expect.objectContaining({
          valorAnterior: 8,
          valorNovo: 9,
          justificativa: 'Revisão da participação',
        }),
      ]);
      expect(
        after.itens.some(
          (item) => item.criterioId === after.ajustes[0]!.criterioId && item.nota === 9,
        ),
      ).toBe(true);
      const persisted = await db.query<Array<{ id: string; score: string }>>(
        `SELECT ei.id, ei.score FROM evaluation_items ei JOIN evaluations e ON e.id = ei.evaluation_id
        WHERE e.session_id = $1 ORDER BY ei.id;`,
        [sessionId],
      );
      expect(persisted).toEqual(before);
      const other = (await api(app, owner).get(evaluationPath(nextSessionId)).expect(200))
        .body as EvaluationResponse;
      expect(other.notaSessao).toBe(scope === 'SESSAO' ? 7 : 7.6);
      const list = await api(app, owner).get(`/sessoes/${sessionId}/avaliacoes`).expect(200);
      expect(list.body).toEqual(
        expect.arrayContaining([expect.objectContaining({ alunoId: student.id, notaSessao: 8.4 })]),
      );
      const [stored] = await db.query<[{ score: string }]>(
        "SELECT session_score AS score FROM evaluations WHERE session_id = $1 AND type = 'TUTOR_SESSION';",
        [sessionId],
      );
      expect(Number(stored.score)).toBe(7.5);
    },
  );

  it('rejects structural changes even when copying a future session from a table used today', async () => {
    await db.query('UPDATE sessions SET date = CURRENT_DATE WHERE id = $1;', [nextSessionId]);
    await edit({ escopo: 'SESSAO', nome: 'Novo', criterios: criteria() }).expect(409);
    const changed = criteria();
    changed[0]!.nome = 'Autonomia';
    await edit({ escopo: 'TODAS', criterios: changed }).expect(409);
  });

  it('serializes editing against a concurrent tutor submission', async () => {
    const [editing, submitting] = await Promise.all([
      edit({ escopo: 'TODAS', nome: 'Novo barema', criterios: criteria() }),
      save({ itens: scores(), enviar: true }),
    ]);
    expect(submitting.status).toBe(200);
    expect([200, 409]).toContain(editing.status);
    const detail = (await api(app, owner).get(evaluationPath()).expect(200))
      .body as EvaluationResponse;
    expect(detail.itens).toEqual(expect.arrayContaining(scores()));
    expect(detail.notaSessao).toBe(editing.status === 200 ? 7.6 : 7);
    const permissions = await api(app, owner).get(`${path()}/permissoes-edicao`).expect(200);
    expect(permissions.body).toMatchObject({ podeEditarCriterios: false });
  });

  it('adds and archives criteria while keeping retained draft notes', async () => {
    await save({ itens: scores(), enviar: false }).expect(200);
    await edit({
      escopo: 'TODAS',
      criterios: [criteria()[0], { nome: 'Evolução', peso: 2 }],
    }).expect(200);
    const detail = (await api(app, owner).get(evaluationPath()).expect(200))
      .body as EvaluationResponse;
    expect(detail.itens).toEqual([{ criterioId: firstId, nota: 8 }]);
    expect(detail.criterios).toEqual(
      expect.arrayContaining([expect.objectContaining({ nome: 'Evolução', notaMaxima: 10 })]),
    );
    const [removed] = await db.query<[{ deletedAt: Date | null }]>(
      'SELECT deleted_at AS "deletedAt" FROM performance_criteria WHERE id = $1;',
      [secondId],
    );
    expect(removed.deletedAt).not.toBeNull();
  });

  it('keeps the room copy available after its author leaves the teaching team', async () => {
    await db.query('INSERT INTO room_tutors (room_id, tutor_id) VALUES ($1, $2);', [
      roomId,
      outsider.id,
    ]);
    const copy = (await edit({ escopo: 'SESSAO', criterios: criteria() }, outsider).expect(200))
      .body as EditResponse;
    await db.query('DELETE FROM room_tutors WHERE room_id = $1 AND tutor_id = $2;', [
      roomId,
      outsider.id,
    ]);
    await api(app, owner)
      .put(`/sessoes/${nextSessionId}/tabela`, { tabelaId: copy.tabela.id })
      .expect(200);
  });

  it('rejects invalid weights and preserves draft scores', async () => {
    await save({ itens: scores(), enviar: false }).expect(200);
    for (const invalid of [{ peso: 11 }, { peso: -1 }, { peso: 8.001 }]) {
      await edit({
        escopo: 'TODAS',
        criterios: [{ ...criteria()[0], ...invalid }, criteria()[1]],
      }).expect(422);
    }
    const detail = (await api(app, owner).get(evaluationPath()).expect(200))
      .body as EvaluationResponse;
    expect(detail.itens).toEqual(expect.arrayContaining(scores()));
    expect(detail.criterios.every((criterion) => criterion.notaMaxima === 10)).toBe(true);
  });

  it.each([
    [false, 'SESSAO'],
    [false, 'TODAS'],
    [true, 'SESSAO'],
    [true, 'TODAS'],
  ])('rejects configurable maximums when occurred=%s and scope=%s', async (occurred, scope) => {
    await save({ itens: scores(), enviar: Boolean(occurred) }).expect(200);
    for (const notaMaxima of [5, 10]) {
      await edit({
        escopo: scope,
        criterios: [{ ...criteria()[0], notaMaxima }, criteria()[1]],
      }).expect(400);
    }
    const detail = (await api(app, owner).get(evaluationPath()).expect(200))
      .body as EvaluationResponse;
    expect(detail.itens).toEqual(expect.arrayContaining(scores()));
    expect(detail.criterios.every((criterion) => criterion.notaMaxima === 10)).toBe(true);
  });

  it('includes other rooms in TODAS and requires access to all affected rooms', async () => {
    const [room] = await db.query<[{ id: string }]>(
      `INSERT INTO rooms (tutor_id, name, course_code, room_code, semester, active)
       VALUES ($1, 'Outra sala', 'EXA123', 'EDT67890', '2026.2', true) RETURNING id;`,
      [outsider.id],
    );
    const [problem] = await db.query<[{ id: string }]>(
      "INSERT INTO problems (room_id, title, order_index, created_by) VALUES ($1, 'P2', 1, $2) RETURNING id;",
      [room.id, outsider.id],
    );
    const [session] = await db.query<[{ id: string }]>(
      `INSERT INTO sessions (problem_id, performance_table_id, title, date, order_index, status)
       VALUES ($1, $2, 'P2S1', CURRENT_DATE + 7, 1, 'agendada') RETURNING id;`,
      [problem.id, tableId],
    );
    await edit({ escopo: 'TODAS', criterios: criteria() }).expect(403);
    await db.query('INSERT INTO room_tutors (room_id, tutor_id) VALUES ($1, $2);', [
      room.id,
      owner.id,
    ]);
    const response = (await edit({ escopo: 'TODAS', criterios: criteria() }).expect(200))
      .body as EditResponse;
    expect(response.sessoesAtualizadas).toHaveLength(3);
    expect(response.sessoesAtualizadas).toContainEqual({ sessaoId: session.id, rotulo: 'P2S1' });
  });

  it('rolls back a failed copy, including remapped scores and audit references', async () => {
    await save({ itens: scores(), enviar: true }).expect(200);
    await save({ itens: scores(9), enviar: true, justificativa: 'Correção justificada' }).expect(
      200,
    );
    const before = await db.query<Array<{ id: string; criterion_id: string }>>(
      'SELECT id, criterion_id FROM evaluation_items ORDER BY id;',
    );
    await db.query(
      "ALTER TABLE session_evaluation_configs ADD CONSTRAINT test_reject_table_copy CHECK (table_name <> 'Barema — P1S1');",
    );
    try {
      await edit({ escopo: 'SESSAO', criterios: criteria() }).expect(500);
    } finally {
      await db.query(
        'ALTER TABLE session_evaluation_configs DROP CONSTRAINT test_reject_table_copy;',
      );
    }
    expect(await db.query('SELECT id, criterion_id FROM evaluation_items ORDER BY id;')).toEqual(
      before,
    );
    const [session] = await db.query<[{ tableId: string }]>(
      'SELECT performance_table_id AS "tableId" FROM sessions WHERE id = $1;',
      [sessionId],
    );
    expect(session.tableId).toBe(tableId);
    const [tables] = await db.query<[{ count: string }]>(
      'SELECT count(*) AS count FROM performance_tables;',
    );
    expect(Number(tables.count)).toBe(1);
    const detail = (await api(app, owner).get(evaluationPath()).expect(200))
      .body as EvaluationResponse;
    expect(detail.ajustes).toHaveLength(1);
    expect(detail.notaSessao).toBe(7.5);
  });

  it('protects the endpoints and documents their contract', async () => {
    await api(app).get(`${path()}/permissoes-edicao`).expect(401);
    await api(app, student).get(`${path()}/permissoes-edicao`).expect(403);
    await api(app, outsider).get(`${path()}/permissoes-edicao`).expect(403);
    await edit({ escopo: 'TODAS', criterios: criteria() }, outsider).expect(403);
    const doc = (await api(app).get('/docs/json').expect(200)).body as OpenAPIObject;
    expect(doc.paths['/api/sessoes/{sessaoId}/tabela/permissoes-edicao']?.get).toBeDefined();
    const put = doc.paths['/api/sessoes/{sessaoId}/tabela/edicao']?.put;
    expect(doc.components?.schemas?.EditSessionCriterionDto).toHaveProperty('properties');
    expect(doc.components?.schemas?.EditSessionCriterionDto).not.toHaveProperty(
      'properties.notaMaxima',
    );
    expect(put?.responses).toEqual(
      expect.objectContaining({
        '200': expect.anything() as unknown,
        '409': expect.anything() as unknown,
        '422': expect.anything() as unknown,
      }),
    );
  });
});
