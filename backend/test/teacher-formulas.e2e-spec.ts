import type { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { UserType } from '@/users/domain/enums/user-type.enum';
import { createTestApp } from './helpers/create-test-app';
import { api, cleanDatabase, insertUser, type TestUser } from './helpers/fixtures';

interface TeacherFormulaResponseBody {
  id?: string;
  escopo: string;
  padrao: boolean;
  versao: number | null;
  componentes: Array<{ tipo: string; peso: number }>;
}

interface SessionConfigResponseBody {
  formula: {
    componentes: Array<{ tipo: string; peso: number }>;
  };
}

describe('Teacher Personal Formulas (e2e)', () => {
  let app: INestApplication;
  let db: DataSource;
  let tutorA: TestUser;
  let tutorB: TestUser;
  let student: TestUser;

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
    tutorA = await insertUser(app, db, 'prof.a@uefs.br', UserType.TUTOR);
    tutorB = await insertUser(app, db, 'prof.b@uefs.br', UserType.TUTOR);
    student = await insertUser(app, db, 'student@discente.uefs.br', UserType.STUDENT);
  });

  describe('GET /professores/me/formulas', () => {
    it('returns the system default formula template when tutor has not saved one', async () => {
      const response = await api(app, tutorA).get('/professores/me/formulas').expect(200);

      expect(response.body).toEqual({
        escopo: 'PROFESSOR',
        padrao: true,
        versao: null,
        componentes: [
          { tipo: 'CRITERIOS', peso: 70 },
          { tipo: 'PAPEL', peso: 30 },
        ],
      });
    });

    it('requires authentication', async () => {
      await api(app).get('/professores/me/formulas').expect(401);
    });

    it('rejects access for students', async () => {
      await api(app, student).get('/professores/me/formulas').expect(403);
    });
  });

  describe('PUT /professores/me/formulas', () => {
    it('creates a personal formula for the tutor on first update', async () => {
      const payload = {
        componentes: [
          { tipo: 'CRITERIOS', peso: 65 },
          { tipo: 'PAPEL', peso: 35 },
        ],
      };

      const response = await api(app, tutorA).put('/professores/me/formulas', payload).expect(200);

      expect(response.body).toMatchObject({
        escopo: 'PROFESSOR',
        padrao: true,
        versao: 1,
        componentes: [
          { tipo: 'CRITERIOS', peso: 65 },
          { tipo: 'PAPEL', peso: 35 },
        ],
      });
      const body = response.body as TeacherFormulaResponseBody;
      expect(body.id).toBeDefined();

      const getResponse = await api(app, tutorA).get('/professores/me/formulas').expect(200);
      expect(getResponse.body).toEqual(response.body);
    });

    it('increments version on subsequent updates', async () => {
      await api(app, tutorA)
        .put('/professores/me/formulas', {
          componentes: [
            { tipo: 'CRITERIOS', peso: 60 },
            { tipo: 'PAPEL', peso: 40 },
          ],
        })
        .expect(200);

      const secondUpdate = await api(app, tutorA)
        .put('/professores/me/formulas', {
          componentes: [
            { tipo: 'CRITERIOS', peso: 80 },
            { tipo: 'PAPEL', peso: 20 },
          ],
        })
        .expect(200);

      expect(secondUpdate.body).toMatchObject({
        escopo: 'PROFESSOR',
        versao: 2,
        componentes: [
          { tipo: 'CRITERIOS', peso: 80 },
          { tipo: 'PAPEL', peso: 20 },
        ],
      });
    });

    it('rejects weights that do not sum to 100', async () => {
      await api(app, tutorA)
        .put('/professores/me/formulas', {
          componentes: [
            { tipo: 'CRITERIOS', peso: 50 },
            { tipo: 'PAPEL', peso: 40 },
          ],
        })
        .expect(422);
    });

    it('rejects invalid component types', async () => {
      await api(app, tutorA)
        .put('/professores/me/formulas', {
          componentes: [
            { tipo: 'INVALIDO', peso: 50 },
            { tipo: 'PAPEL', peso: 50 },
          ],
        })
        .expect(400);
    });

    it('rejects duplicate or missing required components', async () => {
      await api(app, tutorA)
        .put('/professores/me/formulas', {
          componentes: [
            { tipo: 'CRITERIOS', peso: 50 },
            { tipo: 'CRITERIOS', peso: 50 },
          ],
        })
        .expect(422);
    });

    it('requires authentication', async () => {
      await api(app)
        .put('/professores/me/formulas', {
          componentes: [
            { tipo: 'CRITERIOS', peso: 60 },
            { tipo: 'PAPEL', peso: 40 },
          ],
        })
        .expect(401);
    });

    it('rejects access for students', async () => {
      await api(app, student)
        .put('/professores/me/formulas', {
          componentes: [
            { tipo: 'CRITERIOS', peso: 60 },
            { tipo: 'PAPEL', peso: 40 },
          ],
        })
        .expect(403);
    });
  });

  describe('Cenário Crítico: Isolamento, Imutabilidade Histórica e Independência', () => {
    it('edicao de Tutor A nao altera Tutor B nem sessao pre-existente, e serve de template para novas sessoes', async () => {
      const [room] = await db.query<[{ id: string }]>(
        `INSERT INTO rooms (tutor_id, name, course_code, room_code, semester, active)
         VALUES ($1, 'Sala MI', 'EXA123', 'SALA1234', '2026.2', true) RETURNING id;`,
        [tutorA.id],
      );
      const [problem] = await db.query<[{ id: string }]>(
        `INSERT INTO problems (room_id, title, order_index, created_by)
         VALUES ($1, 'Problema 1', 1, $2) RETURNING id;`,
        [room.id, tutorA.id],
      );
      const [session1] = await db.query<[{ id: string }]>(
        `INSERT INTO sessions (problem_id, title, date, order_index)
         VALUES ($1, 'Sessão 1', '2026-10-10', 1) RETURNING id;`,
        [problem.id],
      );

      const session1ConfigBefore = await api(app, tutorA)
        .get(`/sessoes/${session1.id}/configuracao-avaliacao`)
        .expect(200);

      const session1Before = session1ConfigBefore.body as SessionConfigResponseBody;
      expect(session1Before.formula.componentes).toEqual([
        { tipo: 'CRITERIOS', peso: 70 },
        { tipo: 'PAPEL', peso: 30 },
      ]);

      await api(app, tutorA)
        .put('/professores/me/formulas', {
          componentes: [
            { tipo: 'CRITERIOS', peso: 60 },
            { tipo: 'PAPEL', peso: 40 },
          ],
        })
        .expect(200);

      const tutorAFormula = await api(app, tutorA).get('/professores/me/formulas').expect(200);
      const tutorABody = tutorAFormula.body as TeacherFormulaResponseBody;
      expect(tutorABody.componentes).toEqual([
        { tipo: 'CRITERIOS', peso: 60 },
        { tipo: 'PAPEL', peso: 40 },
      ]);

      const tutorBFormula = await api(app, tutorB).get('/professores/me/formulas').expect(200);
      const tutorBBody = tutorBFormula.body as TeacherFormulaResponseBody;
      expect(tutorBBody.componentes).toEqual([
        { tipo: 'CRITERIOS', peso: 70 },
        { tipo: 'PAPEL', peso: 30 },
      ]);

      const session1ConfigAfter = await api(app, tutorA)
        .get(`/sessoes/${session1.id}/configuracao-avaliacao`)
        .expect(200);
      const session1After = session1ConfigAfter.body as SessionConfigResponseBody;
      expect(session1After.formula.componentes).toEqual([
        { tipo: 'CRITERIOS', peso: 70 },
        { tipo: 'PAPEL', peso: 30 },
      ]);

      const [session2] = await db.query<[{ id: string }]>(
        `INSERT INTO sessions (problem_id, title, date, order_index)
         VALUES ($1, 'Sessão 2', '2026-10-17', 2) RETURNING id;`,
        [problem.id],
      );

      const session2Config = await api(app, tutorA)
        .get(`/sessoes/${session2.id}/configuracao-avaliacao`)
        .expect(200);
      const session2Body = session2Config.body as SessionConfigResponseBody;
      expect(session2Body.formula.componentes).toEqual([
        { tipo: 'CRITERIOS', peso: 60 },
        { tipo: 'PAPEL', peso: 40 },
      ]);

      await api(app, tutorA)
        .put('/professores/me/formulas', {
          componentes: [
            { tipo: 'CRITERIOS', peso: 85 },
            { tipo: 'PAPEL', peso: 15 },
          ],
        })
        .expect(200);

      const session1Final = await api(app, tutorA)
        .get(`/sessoes/${session1.id}/configuracao-avaliacao`)
        .expect(200);
      const session1FinalBody = session1Final.body as SessionConfigResponseBody;
      expect(session1FinalBody.formula.componentes).toEqual([
        { tipo: 'CRITERIOS', peso: 70 },
        { tipo: 'PAPEL', peso: 30 },
      ]);

      const session2Final = await api(app, tutorA)
        .get(`/sessoes/${session2.id}/configuracao-avaliacao`)
        .expect(200);
      const session2FinalBody = session2Final.body as SessionConfigResponseBody;
      expect(session2FinalBody.formula.componentes).toEqual([
        { tipo: 'CRITERIOS', peso: 60 },
        { tipo: 'PAPEL', peso: 40 },
      ]);

      const tutorBFinal = await api(app, tutorB).get('/professores/me/formulas').expect(200);
      const tutorBFinalBody = tutorBFinal.body as TeacherFormulaResponseBody;
      expect(tutorBFinalBody.componentes).toEqual([
        { tipo: 'CRITERIOS', peso: 70 },
        { tipo: 'PAPEL', peso: 30 },
      ]);
    });
  });
});
