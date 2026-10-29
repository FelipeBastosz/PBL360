import type { INestApplication } from '@nestjs/common';
import type {
  OpenAPIObject,
  SchemaObject,
} from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';
import { DataSource } from 'typeorm';
import type { ReceivedFeedbackResponseDto } from '@/feedbacks/application/dtos/received-feedback-response.dto';
import type { ReceivedProblemFeedbacksResponseDto } from '@/feedbacks/application/dtos/received-problem-feedbacks-response.dto';
import type { GradesResponseDto } from '@/grades/application/dtos/grades-response.dto';
import { createTestApp } from './helpers/create-test-app';
import { api, cleanDatabase } from './helpers/fixtures';
import {
  createFeedbackGradeFixture,
  evaluationItems,
  type FeedbackGradeFixture,
} from './helpers/received-feedback-grade-fixtures';

describe('Associated grades in received feedbacks (e2e)', () => {
  let app: INestApplication, db: DataSource, fixture: FeedbackGradeFixture;
  const problemPath = () => `/salas/${fixture.roomId}/problemas/${fixture.problemId}`;
  const problemFeedbackPath = () =>
    `/minhas-salas/${fixture.roomId}/problemas/${fixture.problemId}/feedbacks`;
  const sessionFeedbackPath = () => `/sessoes/${fixture.sessionId}/feedbacks/meu-feedback`;
  const save = (
    send: boolean,
    first = 7,
    second = 9,
    session = fixture.sessionId,
    student = fixture.student.id,
    justification?: string,
  ) =>
    api(app, fixture.tutor)
      .put(`/sessoes/${session}/avaliacoes/${student}`, {
        itens: evaluationItems(fixture, first, second),
        enviar: send,
        ...(justification ? { justificativa: justification } : {}),
      })
      .expect(200);
  const readProblem = async (student = fixture.student) => {
    const response = await api(app, student).get(problemFeedbackPath()).expect(200);
    return response.body as ReceivedProblemFeedbacksResponseDto;
  };

  beforeAll(async () => {
    const created = await createTestApp();
    app = created.app;
    db = created.moduleRef.get(DataSource);
  });
  afterAll(async () => {
    await cleanDatabase(db);
    await app.close();
  });
  beforeEach(async () => {
    await cleanDatabase(db);
    fixture = await createFeedbackGradeFixture(app, db);
    await api(app, fixture.tutor)
      .put(`${problemPath()}/feedbacks/geral`, { texto: 'Feedback geral do problema.' })
      .expect(200);
    await api(app, fixture.tutor)
      .put(`${problemPath()}/feedbacks/alunos/${fixture.student.id}`, {
        texto: 'Feedback individual do aluno.',
        nota: 9.5,
      })
      .expect(200);
    await api(app, fixture.tutor)
      .put(`/sessoes/${fixture.sessionId}/alunos/${fixture.student.id}/feedback`, {
        texto: 'Feedback da primeira sessão.',
      })
      .expect(200);
  });

  it('returns null grades and no session feedback before the tutor sends the evaluation', async () => {
    await save(false);
    const result = await readProblem();
    expect(result).toMatchObject({
      notaFinal: null,
      individual: { nota: null },
      geral: { nota: null },
    });
    expect(result.feedbacks.every((feedback) => feedback.nota === null)).toBe(true);
    expect(result.sessoes.every((session) => session.feedback === null)).toBe(true);
    expect(result.individual?.texto).toBe('Feedback individual do aluno.');
    const session = await api(app, fixture.student).get(sessionFeedbackPath()).expect(200);
    expect(session.body).toBeNull();
  });

  it('releases calculated scores through both route names after sending without a prior tutor report read', async () => {
    await save(true);
    const result = await readProblem();
    expect(result).toMatchObject({
      notaFinal: 8.5,
      individual: { nota: 9.5 },
      geral: { nota: 8.5 },
    });
    expect(result.feedbacks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ tipo: 'SESSAO', sessaoId: fixture.sessionId, nota: 8.5 }),
        expect.objectContaining({ tipo: 'GERAL', nota: 8.5 }),
      ]),
    );
    const legacy = await api(app, fixture.student)
      .get(`${problemPath()}/meus-feedbacks`)
      .expect(200);
    expect((legacy.body as ReceivedProblemFeedbacksResponseDto).notaFinal).toBe(8.5);
    for (const path of [sessionFeedbackPath(), `/sessoes/${fixture.sessionId}/meu-feedback`]) {
      const response = await api(app, fixture.student).get(path).expect(200);
      expect(response.body as ReceivedFeedbackResponseDto).toMatchObject({
        nota: 8.5,
        novo: false,
        autor: { id: fixture.tutor.id },
      });
      expect(response.body).not.toHaveProperty('itens');
      expect(response.headers['cache-control']).toBe('private, no-store');
    }
    expect(await db.query<unknown[]>('SELECT * FROM problem_grades')).toEqual([]);
  });

  it('excludes draft sessions and their absence grades from the released final grade', async () => {
    await save(true);
    await save(false, 0, 0, fixture.otherSessionId);
    await db.query(
      "INSERT INTO attendances (session_id, student_id, status, recorded_by) VALUES ($1, $2, 'ABSENT', $3)",
      [fixture.otherSessionId, fixture.student.id, fixture.tutor.id],
    );
    const tutor = await api(app, fixture.tutor).get(`${problemPath()}/notas`).expect(200);
    expect(
      (tutor.body as GradesResponseDto).alunos.find((row) => row.alunoId === fixture.student.id)
        ?.notaFinal,
    ).toBe(4.3);
    expect((await readProblem()).notaFinal).toBe(8.5);
    const [stored] = await db.query<[{ grade: string }]>(
      'SELECT grade FROM problem_grades WHERE problem_id = $1 AND student_id = $2',
      [fixture.problemId, fixture.student.id],
    );
    expect(Number(stored.grade)).toBe(4.25);
  });

  it('preserves zero and uses the configured problem weights after both sessions are sent', async () => {
    await save(true);
    await save(true, 0, 0, fixture.otherSessionId);
    await api(app, fixture.tutor)
      .put(`${problemPath()}/formula-final`, {
        sessoes: [
          { sessaoId: fixture.sessionId, peso: 3 },
          { sessaoId: fixture.otherSessionId, peso: 1 },
        ],
      })
      .expect(200);
    await api(app, fixture.tutor)
      .put(`/sessoes/${fixture.otherSessionId}/alunos/${fixture.student.id}/feedback`, {
        texto: 'Nota zero registrada.',
      })
      .expect(200);
    const result = await readProblem();
    expect(result.notaFinal).toBe(6.4);
    expect(
      result.sessoes.find((session) => session.sessaoId === fixture.otherSessionId)?.feedback?.nota,
    ).toBe(0);
    const tutor = await api(app, fixture.tutor).get(`${problemPath()}/notas`).expect(200);
    expect(
      (tutor.body as GradesResponseDto).alunos.find((row) => row.alunoId === fixture.student.id)
        ?.notaFinal,
    ).toBe(result.notaFinal);
  });

  it('reflects justified tutor adjustments on the next feedback read', async () => {
    await save(true);
    expect((await readProblem()).notaFinal).toBe(8.5);
    await save(
      true,
      8,
      10,
      fixture.sessionId,
      fixture.student.id,
      'Correção após revisão da avaliação.',
    );
    const result = await readProblem();
    expect(result.notaFinal).toBe(9.5);
    expect(result.sessoes[0]?.feedback).toMatchObject({ nota: 9.5, novo: false });
  });

  it('includes the recorded role score using the same rounding as the grade report', async () => {
    await db.query(
      "INSERT INTO session_roles (session_id, student_id, role, role_score) VALUES ($1, $2, 'COORDINATOR', 5)",
      [fixture.sessionId, fixture.student.id],
    );
    await save(true);
    const result = await readProblem();
    expect(result.sessoes[0]?.feedback?.nota).toBe(7.5);
    expect(result.notaFinal).toBe(7.5);
  });

  it('does not release any grade for a student just because a colleague was evaluated', async () => {
    await save(true, 10, 10, fixture.sessionId, fixture.colleague.id);
    const response = await api(app, fixture.student)
      .get(`${problemFeedbackPath()}?alunoId=${fixture.colleague.id}`)
      .expect(200);
    const body = response.body as ReceivedProblemFeedbacksResponseDto;
    expect(body.notaFinal).toBeNull();
    expect(body.feedbacks.every((feedback) => feedback.nota === null)).toBe(true);
    const colleague = await readProblem(fixture.colleague);
    expect(colleague.notaFinal).toBe(10);
    expect(colleague.individual).toBeNull();
  });

  it('keeps all feedback grade routes private', async () => {
    await save(true);
    for (const path of [
      problemFeedbackPath(),
      sessionFeedbackPath(),
      `${problemPath()}/meus-feedbacks`,
      `/sessoes/${fixture.sessionId}/meu-feedback`,
    ]) {
      await api(app).get(path).expect(401);
      await api(app, fixture.outsider).get(path).expect(403);
      await api(app, fixture.tutor).get(path).expect(403);
    }
    expect(await db.query<unknown[]>('SELECT * FROM feedback_views')).toEqual([]);
  });

  it('documents the new routes and nullable associated scores', async () => {
    const response = await api(app).get('/docs/json').expect(200);
    const document = response.body as OpenAPIObject;
    for (const path of [
      '/api/minhas-salas/{salaId}/problemas/{problemaId}/feedbacks',
      '/api/sessoes/{sessaoId}/feedbacks/meu-feedback',
    ]) {
      expect(document.paths[path]?.get?.responses['200']).toBeDefined();
      expect(document.paths[path]?.get?.responses['403']).toBeDefined();
    }
    const schemas = document.components!.schemas!;
    expect((schemas.ReceivedFeedbackResponseDto as SchemaObject).properties?.nota).toMatchObject({
      type: 'number',
      nullable: true,
    });
    expect(
      (schemas.ReceivedProblemFeedbacksResponseDto as SchemaObject).properties?.notaFinal,
    ).toMatchObject({ type: 'number', nullable: true });
  });
});
