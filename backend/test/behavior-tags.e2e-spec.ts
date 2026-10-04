import type { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { UserType } from '@/users/domain/enums/user-type.enum';
import { createTestApp } from './helpers/create-test-app';
import { api, cleanDatabase, insertUser, type TestUser } from './helpers/fixtures';

const MISSING_ID = '00000000-0000-4000-8000-000000000000';

interface TagBody {
  id: string;
  nome: string;
  predefinida: boolean;
  ativa: boolean;
}

describe('Behavior tags (e2e)', () => {
  let app: INestApplication;
  let database: DataSource;
  let tutor: TestUser;
  let otherTutor: TestUser;
  let student: TestUser;
  let predefinedId: string;

  const createTag = async (user: TestUser, nome: string): Promise<TagBody> => {
    const response = await api(app, user).post('/marcacoes', { nome }).expect(201);
    return response.body as TagBody;
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
    otherTutor = await insertUser(app, database, 'other@uefs.br');
    student = await insertUser(app, database, 'aluno@discente.uefs.br', UserType.STUDENT);
    const [row] = await database.query<[{ id: string }]>(
      "INSERT INTO behavior_tags (nome) VALUES ('Atraso') RETURNING id;",
    );
    predefinedId = row.id;
  });

  describe('GET /marcacoes', () => {
    it("lists predefined and own active tags, never another tutor's or deactivated ones", async () => {
      const own = await createTag(tutor, 'Liderou o grupo');
      const removed = await createTag(tutor, 'Antiga');
      await createTag(otherTutor, 'Só do outro');
      await api(app, tutor).delete(`/marcacoes/${removed.id}`).expect(204);

      const response = await api(app, tutor).get('/marcacoes').expect(200);

      expect(response.body).toEqual([
        { id: predefinedId, nome: 'Atraso', predefinida: true, ativa: true },
        { id: own.id, nome: 'Liderou o grupo', predefinida: false, ativa: true },
      ]);
    });

    it('rejects students and anonymous requests', async () => {
      await api(app, student).get('/marcacoes').expect(403);
      await api(app).get('/marcacoes').expect(401);
    });
  });

  describe('POST /marcacoes', () => {
    it('creates a custom tag with the trimmed name', async () => {
      const tag = await createTag(tutor, '  Liderou o grupo ');

      expect(tag).toEqual({
        id: expect.any(String) as string,
        nome: 'Liderou o grupo',
        predefinida: false,
        ativa: true,
      });
    });

    it('rejects a name the tutor already uses, but lets another tutor use it', async () => {
      await createTag(tutor, 'Liderou o grupo');

      await api(app, tutor).post('/marcacoes', { nome: 'Liderou o grupo' }).expect(409);
      await api(app, otherTutor).post('/marcacoes', { nome: 'Liderou o grupo' }).expect(201);
    });

    it('rejects blank, too long and unexpected fields', async () => {
      await api(app, tutor).post('/marcacoes', { nome: '   ' }).expect(400);
      await api(app, tutor)
        .post('/marcacoes', { nome: 'x'.repeat(81) })
        .expect(400);
      await api(app, tutor)
        .post('/marcacoes', { nome: 'Válida', tutorId: otherTutor.id })
        .expect(400);
    });
  });

  describe('PUT /marcacoes/:id', () => {
    it('renames an own tag, including saving it with the same name', async () => {
      const tag = await createTag(tutor, 'Liderou');

      await api(app, tutor).put(`/marcacoes/${tag.id}`, { nome: 'Liderou' }).expect(200);
      const response = await api(app, tutor)
        .put(`/marcacoes/${tag.id}`, { nome: 'Liderou o grupo' })
        .expect(200);

      expect((response.body as TagBody).nome).toBe('Liderou o grupo');
    });

    it('rejects the name of another own tag', async () => {
      await createTag(tutor, 'Primeira');
      const second = await createTag(tutor, 'Segunda');

      await api(app, tutor).put(`/marcacoes/${second.id}`, { nome: 'Primeira' }).expect(409);
    });

    it("forbids renaming a predefined or another tutor's tag", async () => {
      const others = await createTag(otherTutor, 'Do outro');

      await api(app, tutor).put(`/marcacoes/${predefinedId}`, { nome: 'X' }).expect(403);
      await api(app, tutor).put(`/marcacoes/${others.id}`, { nome: 'X' }).expect(403);
    });

    it('reports a missing tag and validates the id', async () => {
      await api(app, tutor).put(`/marcacoes/${MISSING_ID}`, { nome: 'X' }).expect(404);
      await api(app, tutor).put('/marcacoes/abc', { nome: 'X' }).expect(400);
    });
  });

  describe('DELETE /marcacoes/:id', () => {
    it('deactivates the tag instead of deleting the row', async () => {
      const tag = await createTag(tutor, 'Liderou');

      await api(app, tutor).delete(`/marcacoes/${tag.id}`).expect(204);

      const rows = await database.query<{ ativa: boolean }[]>(
        'SELECT ativa FROM behavior_tags WHERE id = $1;',
        [tag.id],
      );
      expect(rows).toEqual([{ ativa: false }]);
      await api(app, tutor).delete(`/marcacoes/${tag.id}`).expect(404);
    });

    it("forbids deleting a predefined or another tutor's tag", async () => {
      const others = await createTag(otherTutor, 'Do outro');

      await api(app, tutor).delete(`/marcacoes/${predefinedId}`).expect(403);
      await api(app, tutor).delete(`/marcacoes/${others.id}`).expect(403);
    });
  });
});
