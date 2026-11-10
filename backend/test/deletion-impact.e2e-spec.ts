import { randomUUID } from 'node:crypto';
import type { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import {
  PROBLEM_REPOSITORY,
  type ProblemRepository,
} from '@/problems/domain/repositories/problem.repository';
import {
  SESSION_REPOSITORY,
  type SessionRepository,
} from '@/sessions/domain/repositories/session.repository';
import { createTestApp } from './helpers/create-test-app';
import { api, cleanDatabase, insertUser } from './helpers/fixtures';
import {
  createDeletionFixture,
  insertDeletionFeedback,
  insertDeletionSession,
  insertDeletionEvaluation,
  insertSessionActivity,
  type DeletionFixture,
} from './helpers/deletion-impact-fixtures';

const EMPTY_SESSION = { chamada: 0, papeis: 0, observacoes: 0, avaliacoes: 0, feedbacks: 0 };
const EMPTY_PROBLEM = { sessoes: 0, notas: 0, feedbacks: 0, avaliacoes: 0 };

describe('Deletion impact (e2e)', () => {
  let app: INestApplication;
  let db: DataSource;
  let fixture: DeletionFixture;
  const problemPath = () => `/salas/${fixture.roomId}/problemas/${fixture.problemId}`;
  const sessionPath = (id: string) => `${problemPath()}/sessoes/${id}`;

  beforeAll(async () => {
    const created = await createTestApp();
    app = created.app;
    db = created.moduleRef.get(DataSource);
  }, 30000);

  beforeEach(async () => {
    await cleanDatabase(db);
    fixture = await createDeletionFixture(app, db);
  }, 30000);

  afterEach(() => jest.restoreAllMocks());

  afterAll(async () => {
    try {
      if (db?.isInitialized) await cleanDatabase(db);
    } finally {
      await app?.close();
    }
  }, 30000);

  it('blocks a problem with general and individual feedbacks and no sessions', async () => {
    await api(app, fixture.owner)
      .put(`${problemPath()}/feedbacks/geral`, { texto: 'Feedback geral.' })
      .expect(200);
    await api(app, fixture.owner)
      .put(`${problemPath()}/feedbacks/alunos/${fixture.student.id}`, {
        texto: 'Feedback individual.',
        nota: 0,
      })
      .expect(200);
    const expected = { ...EMPTY_PROBLEM, feedbacks: 2 };
    const impact = await api(app, fixture.owner)
      .get(`${problemPath()}/impacto-exclusao`)
      .expect(200);
    expect(impact.body).toEqual(expected);
    const response = await api(app, fixture.owner).delete(problemPath()).expect(409);
    expect(response.body).toEqual({
      statusCode: 409,
      error: 'Conflict',
      message: 'O problema não pode ser excluído pois possui registros vinculados.',
      detalhes: expected,
    });
    await api(app, fixture.owner).get(problemPath()).expect(200);
    const [row] = await db.query<[{ count: number }]>(
      'SELECT COUNT(*)::int AS count FROM feedback WHERE problema_id = $1',
      [fixture.problemId],
    );
    expect(row.count).toBe(2);
  });

  it('counts only session feedbacks, without counting revisions or sibling sessions', async () => {
    const sessionId = await insertDeletionSession(db, fixture.problemId);
    const siblingId = await insertDeletionSession(db, fixture.problemId);
    await insertDeletionFeedback(db, fixture, siblingId);
    await insertDeletionFeedback(db, fixture);
    const feedbackPath = `/sessoes/${sessionId}/alunos/${fixture.student.id}/feedback`;
    await api(app, fixture.owner).put(feedbackPath, { texto: 'Primeiro feedback.' }).expect(200);
    await api(app, fixture.owner).put(feedbackPath, { texto: 'Feedback revisado.' }).expect(200);
    const expected = { ...EMPTY_SESSION, feedbacks: 1 };
    const impact = await api(app, fixture.owner)
      .get(`${sessionPath(sessionId)}/impacto-exclusao`)
      .expect(200);
    expect(impact.body).toEqual({ podeExcluir: false, ...expected });
    const response = await api(app, fixture.owner).delete(sessionPath(sessionId)).expect(409);
    expect(response.body).toEqual({
      statusCode: 409,
      error: 'Conflict',
      message: 'A sessão não pode ser excluída pois possui registros vinculados.',
      detalhes: expected,
    });
    await api(app, fixture.owner).get(sessionPath(sessionId)).expect(200);
    const [row] = await db.query<[{ count: number }]>(
      'SELECT COUNT(*)::int AS count FROM feedback WHERE sessao_id = $1',
      [sessionId],
    );
    expect(row.count).toBe(1);
  });

  it('reports actual evaluations, attendance, roles and observations alongside feedbacks', async () => {
    const sessionId = await insertDeletionSession(db, fixture.problemId);
    await insertDeletionFeedback(db, fixture, sessionId);
    await insertDeletionFeedback(db, fixture);
    await insertDeletionEvaluation(db, fixture, sessionId);
    await insertSessionActivity(db, fixture, sessionId);
    await db.query(
      'INSERT INTO problem_grades (problem_id, student_id, grade, formula_version) VALUES ($1, $2, 0, 1)',
      [fixture.problemId, fixture.student.id],
    );
    const expectedSession = { chamada: 1, papeis: 1, observacoes: 1, avaliacoes: 1, feedbacks: 1 };
    const expectedProblem = { sessoes: 1, notas: 1, avaliacoes: 1, feedbacks: 2 };
    const sessionImpact = await api(app, fixture.owner)
      .get(`${sessionPath(sessionId)}/impacto-exclusao`)
      .expect(200);
    expect(sessionImpact.body).toEqual({ podeExcluir: false, ...expectedSession });
    const problemImpact = await api(app, fixture.owner)
      .get(`${problemPath()}/impacto-exclusao`)
      .expect(200);
    expect(problemImpact.body).toEqual(expectedProblem);
    expect(
      (await api(app, fixture.owner).delete(sessionPath(sessionId)).expect(409)).body,
    ).toMatchObject({ detalhes: expectedSession });
    expect((await api(app, fixture.owner).delete(problemPath()).expect(409)).body).toMatchObject({
      detalhes: expectedProblem,
    });
  });

  it('does not include feedbacks from another problem', async () => {
    const [other] = await db.query<[{ id: string }]>(
      `INSERT INTO problems (room_id, title, order_index, created_by) VALUES ($1, 'Outro problema', 2, $2) RETURNING id;`,
      [fixture.roomId, fixture.owner.id],
    );
    await insertDeletionFeedback(db, { ...fixture, problemId: other.id });
    const impact = await api(app, fixture.owner)
      .get(`${problemPath()}/impacto-exclusao`)
      .expect(200);
    expect(impact.body).toEqual(EMPTY_PROBLEM);
    await api(app, fixture.owner).delete(problemPath()).expect(204);
  });

  it('still deletes empty sessions and then the empty problem', async () => {
    const sessionId = await insertDeletionSession(db, fixture.problemId);
    const impact = await api(app, fixture.owner)
      .get(`${sessionPath(sessionId)}/impacto-exclusao`)
      .expect(200);
    expect(impact.body).toEqual({ podeExcluir: true, ...EMPTY_SESSION });
    await api(app, fixture.owner).delete(sessionPath(sessionId)).expect(204);
    await api(app, fixture.owner).delete(problemPath()).expect(204);
  });

  it('rechecks feedbacks inside the problem deletion transaction', async () => {
    await insertDeletionFeedback(db, fixture);
    jest
      .spyOn(app.get<ProblemRepository>(PROBLEM_REPOSITORY), 'getDeletionImpact')
      .mockResolvedValueOnce({ sessions: 0, grades: 0, feedbacks: 0, evaluations: 0 });
    const response = await api(app, fixture.owner).delete(problemPath()).expect(409);
    expect(response.body).toMatchObject({ detalhes: { ...EMPTY_PROBLEM, feedbacks: 1 } });
    await api(app, fixture.owner).get(problemPath()).expect(200);
  });

  it('rechecks feedbacks inside the session deletion transaction', async () => {
    const sessionId = await insertDeletionSession(db, fixture.problemId);
    await insertDeletionFeedback(db, fixture, sessionId);
    jest
      .spyOn(app.get<SessionRepository>(SESSION_REPOSITORY), 'getDeletionImpact')
      .mockResolvedValueOnce(EMPTY_SESSION);
    const response = await api(app, fixture.owner).delete(sessionPath(sessionId)).expect(409);
    expect(response.body).toMatchObject({ detalhes: { ...EMPTY_SESSION, feedbacks: 1 } });
    await api(app, fixture.owner).get(sessionPath(sessionId)).expect(200);
  });

  it('does not reveal counts to unauthenticated users or tutors from another room', async () => {
    const outsider = await insertUser(app, db, 'outsider417@test.local');
    const sessionId = await insertDeletionSession(db, fixture.problemId);
    await insertDeletionFeedback(db, fixture, sessionId);
    for (const path of [problemPath(), sessionPath(sessionId)]) {
      await api(app).get(`${path}/impacto-exclusao`).expect(401);
      await api(app).delete(path).expect(401);
      const impact = await api(app, outsider).get(`${path}/impacto-exclusao`).expect(403);
      const deletion = await api(app, outsider).delete(path).expect(403);
      expect(impact.body).not.toHaveProperty('detalhes');
      expect(deletion.body).not.toHaveProperty('detalhes');
    }
  });

  it('rejects nonexistent or mismatched parents before returning impact', async () => {
    const sessionId = await insertDeletionSession(db, fixture.problemId);
    const otherProblem = `/salas/${fixture.roomId}/problemas/${randomUUID()}`;
    await api(app, fixture.owner).get(`${otherProblem}/impacto-exclusao`).expect(404);
    await api(app, fixture.owner).delete(otherProblem).expect(404);
    await api(app, fixture.owner)
      .get(`${otherProblem}/sessoes/${sessionId}/impacto-exclusao`)
      .expect(404);
    await api(app, fixture.owner).delete(`${otherProblem}/sessoes/${sessionId}`).expect(404);
  });

  it('documents the structured conflict response on both deletion routes', async () => {
    const response = await api(app).get('/docs/json').expect(200);
    const document = response.body as {
      paths: Record<
        string,
        {
          delete: {
            responses: Record<string, { content: Record<string, { schema: { $ref: string } }> }>;
          };
        }
      >;
      components: { schemas: Record<string, { properties: Record<string, unknown> }> };
    };
    const problem = document.paths['/api/salas/{roomId}/problemas/{problemId}']!.delete;
    const session =
      document.paths['/api/salas/{roomId}/problemas/{problemId}/sessoes/{sessionId}']!.delete;
    expect(problem.responses['409']!.content['application/json']!.schema.$ref).toBe(
      '#/components/schemas/ProblemDeletionConflictDto',
    );
    expect(session.responses['409']!.content['application/json']!.schema.$ref).toBe(
      '#/components/schemas/SessionDeletionConflictDto',
    );
    expect(document.components.schemas.ProblemDeletionConflictDto!.properties).toHaveProperty(
      'detalhes',
    );
    expect(document.components.schemas.SessionDeletionConflictDto!.properties).toHaveProperty(
      'detalhes',
    );
  });
});
