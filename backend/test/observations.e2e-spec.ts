import type { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { UserType } from '@/users/domain/enums/user-type.enum';
import { createTestApp } from './helpers/create-test-app';
import {
  api,
  cleanDatabase,
  insertDefaultPerformanceTable,
  insertUser,
  type TestUser,
} from './helpers/fixtures';

const MISSING_ID = '00000000-0000-4000-8000-000000000000';

interface ObservationBody {
  id: string;
  marcacoes: { id: string; nome: string }[];
  texto: string | null;
  criadaEm: string;
}

describe('Observations (e2e)', () => {
  let app: INestApplication;
  let database: DataSource;
  let tutor: TestUser;
  let outsider: TestUser;
  let student: TestUser;
  let otherStudent: TestUser;
  let sessionId: string;
  let tags: { predefined: string; own: string; others: string; inactive: string };

  const path = (studentId = student.id) => `/sessoes/${sessionId}/alunos/${studentId}/observacoes`;

  const insertTag = async (name: string, tutorId: string | null, active = true) => {
    const [row] = await database.query<[{ id: string }]>(
      'INSERT INTO behavior_tags (name, tutor_id, active) VALUES ($1, $2, $3) RETURNING id;',
      [name, tutorId, active],
    );
    return row.id;
  };

  const register = async (body: object): Promise<ObservationBody> => {
    const response = await api(app, tutor).post(path(), body).expect(201);
    return response.body as ObservationBody;
  };

  const countObservations = async () => {
    const [row] = await database.query<[{ count: string }]>('SELECT count(*) FROM observations;');
    return Number(row.count);
  };

  beforeAll(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
    database = testApp.moduleRef.get(DataSource);
  });

  afterAll(async () => {
    if (database) await cleanDatabase(database);
    if (app) await app.close();
  });

  beforeEach(async () => {
    await cleanDatabase(database);
    tutor = await insertUser(app, database, 'tutor@uefs.br');
    outsider = await insertUser(app, database, 'outsider@uefs.br');
    student = await insertUser(app, database, '20260001@discente.uefs.br', UserType.STUDENT);
    otherStudent = await insertUser(app, database, '20260002@discente.uefs.br', UserType.STUDENT);

    const [room] = await database.query<[{ id: string }]>(
      `INSERT INTO rooms (tutor_id, name, course_code, room_code, semester, active)
       VALUES ($1, 'Sala de Teste', 'EXA123', 'ROOM1234', '2026.2', true) RETURNING id;`,
      [tutor.id],
    );
    await insertDefaultPerformanceTable(database, tutor.id);
    await database.query('INSERT INTO room_students (room_id, student_id) VALUES ($1, $2);', [
      room.id,
      student.id,
    ]);
    const [problem] = await database.query<[{ id: string }]>(
      `INSERT INTO problems (room_id, title, description, order_index, created_by)
       VALUES ($1, 'Problema 1', 'Descrição', 1, $2) RETURNING id;`,
      [room.id, tutor.id],
    );
    const [session] = await database.query<[{ id: string }]>(
      `INSERT INTO sessions (problem_id, title, date, order_index, status)
       VALUES ($1, 'Sessão 1', '2026-10-15', 1, 'agendada') RETURNING id;`,
      [problem.id],
    );
    sessionId = session.id;

    tags = {
      predefined: await insertTag('Atraso', null),
      own: await insertTag('Liderou o grupo', tutor.id),
      others: await insertTag('Do outro professor', outsider.id),
      inactive: await insertTag('Antiga', tutor.id, false),
    };
  });

  describe('POST /sessoes/:sessaoId/alunos/:alunoId/observacoes', () => {
    it('registers an observation with predefined and own tags', async () => {
      const body = await register({ marcacaoIds: [tags.own, tags.predefined] });

      expect(body).toEqual({
        id: expect.any(String) as string,
        marcacoes: [
          { id: tags.predefined, nome: 'Atraso' },
          { id: tags.own, nome: 'Liderou o grupo' },
        ],
        texto: null,
        criadaEm: expect.any(String) as string,
      });
    });

    it('registers an observation made only of text', async () => {
      const body = await register({ texto: '  Chegou 15 minutos atrasado ' });

      expect(body.texto).toBe('Chegou 15 minutos atrasado');
      expect(body.marcacoes).toEqual([]);
    });

    it('rejects invalid bodies with 400', async () => {
      await api(app, tutor).post(path(), {}).expect(400);
      await api(app, tutor).post(path(), { texto: '   ' }).expect(400);
      await api(app, tutor)
        .post(path(), { texto: 'x'.repeat(1001) })
        .expect(400);
      await api(app, tutor)
        .post(path(), { marcacaoIds: [tags.own, tags.own] })
        .expect(400);
      await api(app, tutor)
        .post(path(), { marcacaoIds: ['abc'] })
        .expect(400);
    });

    it("rejects inactive or another tutor's tags with 422 and saves nothing", async () => {
      await api(app, tutor)
        .post(path(), { marcacaoIds: [tags.others] })
        .expect(422);
      await api(app, tutor)
        .post(path(), { marcacaoIds: [tags.inactive] })
        .expect(422);
      await api(app, tutor)
        .post(path(), { marcacaoIds: [tags.own, MISSING_ID] })
        .expect(422);

      expect(await countObservations()).toBe(0);
    });

    it('rejects a student who is not enrolled in the room with 422', async () => {
      await api(app, tutor)
        .post(path(otherStudent.id), { marcacaoIds: [tags.own] })
        .expect(422);
    });

    it('rejects a tutor without access to the room and a missing session', async () => {
      await api(app, outsider)
        .post(path(), { marcacaoIds: [tags.predefined] })
        .expect(403);
      await api(app, tutor)
        .post(`/sessoes/${MISSING_ID}/alunos/${student.id}/observacoes`, { texto: 'X' })
        .expect(404);
    });

    it('rejects students and anonymous requests', async () => {
      await api(app, student).post(path(), { texto: 'X' }).expect(403);
      await api(app).post(path(), { texto: 'X' }).expect(401);
    });
  });

  describe('GET /sessoes/:sessaoId/alunos/:alunoId/observacoes', () => {
    it('lists the newest first and counts each tag', async () => {
      const first = await register({ marcacaoIds: [tags.predefined, tags.own] });
      const second = await register({ marcacaoIds: [tags.predefined] });
      const third = await register({ texto: 'Só texto' });

      const response = await api(app, tutor).get(path()).expect(200);
      const body = response.body as { observacoes: ObservationBody[]; contagem: object };

      expect(body.observacoes.map((o) => o.id)).toEqual([third.id, second.id, first.id]);
      expect(body.contagem).toEqual({ [tags.predefined]: 2, [tags.own]: 1 });
    });

    it('returns an empty list for a student without observations', async () => {
      const response = await api(app, tutor).get(path()).expect(200);

      expect(response.body).toEqual({ observacoes: [], contagem: {} });
    });
  });

  describe('PATCH /observacoes/:id', () => {
    it('complements the observation with text, keeping its tags', async () => {
      const created = await register({ marcacaoIds: [tags.own] });

      const response = await api(app, tutor)
        .patch(`/observacoes/${created.id}`, { texto: '  Usou o celular ' })
        .expect(200);

      expect(response.body).toEqual({ ...created, texto: 'Usou o celular' });
    });

    it('rejects blank text, another tutor and a missing observation', async () => {
      const created = await register({ marcacaoIds: [tags.own] });

      await api(app, tutor).patch(`/observacoes/${created.id}`, { texto: '  ' }).expect(400);
      await api(app, outsider).patch(`/observacoes/${created.id}`, { texto: 'X' }).expect(403);
      await api(app, tutor).patch(`/observacoes/${MISSING_ID}`, { texto: 'X' }).expect(404);
    });
  });

  describe('DELETE /observacoes/:id', () => {
    it('deletes the observation together with its tags', async () => {
      const created = await register({ marcacaoIds: [tags.own, tags.predefined] });

      await api(app, tutor).delete(`/observacoes/${created.id}`).expect(204);

      expect(await countObservations()).toBe(0);
      const links = await database.query<unknown[]>('SELECT * FROM observation_tags;');
      expect(links).toEqual([]);
      await api(app, tutor).delete(`/observacoes/${created.id}`).expect(404);
    });

    it('rejects another tutor', async () => {
      const created = await register({ marcacaoIds: [tags.own] });

      await api(app, outsider).delete(`/observacoes/${created.id}`).expect(403);
      expect(await countObservations()).toBe(1);
    });
  });
});
