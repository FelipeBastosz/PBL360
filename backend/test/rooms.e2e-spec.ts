import type { INestApplication } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { UserType } from '@/users/domain/enums/user-type.enum';
import { createTestApp } from './helpers/create-test-app';
import { api, cleanDatabase, insertUser, type TestUser } from './helpers/fixtures';

interface RoomBody {
  id: string;
  professorResponsavelId: string;
  nome: string;
  codigoDisciplina: string;
  codigoSala: string;
  semestre: string;
  ativo: boolean;
  criadoEm: string;
}

const NEW_ROOM = { nome: 'Engenharia de Software', codigoDisciplina: 'exa123', semestre: '2026.2' };
const MISSING_ID = '00000000-0000-4000-8000-000000000000';

describe('Rooms (e2e)', () => {
  let app: INestApplication;
  let moduleRef: TestingModule;
  let dataSource: DataSource;
  let owner: TestUser;
  let colleague: TestUser;
  let student: TestUser;

  beforeAll(async () => {
    ({ app, moduleRef } = await createTestApp());
    dataSource = moduleRef.get(DataSource);
  });

  afterAll(async () => {
    await cleanDatabase(dataSource);
    await app.close();
  });

  beforeEach(async () => {
    await cleanDatabase(dataSource);
    owner = await insertUser(app, dataSource, 'carlos@uefs.br');
    colleague = await insertUser(app, dataSource, 'maria@uefs.br');
    student = await insertUser(app, dataSource, '20240001@discente.uefs.br', UserType.STUDENT);
  });

  const createRoom = async (): Promise<RoomBody> => {
    const response = await api(app, owner).post('/salas', NEW_ROOM).expect(201);
    return response.body as RoomBody;
  };

  const deletedAtOf = async (roomId: string): Promise<Date | null> => {
    const [row] = await dataSource.query<[{ deleted_at: Date | null }]>(
      'SELECT deleted_at FROM rooms WHERE id = $1;',
      [roomId],
    );
    return row.deleted_at;
  };

  describe('POST /salas', () => {
    it('creates a room owned by the authenticated tutor, in Portuguese', async () => {
      const room = await createRoom();

      expect(room).toMatchObject({
        professorResponsavelId: owner.id,
        nome: 'Engenharia de Software',
        codigoDisciplina: 'EXA123',
        semestre: '2026.2',
        ativo: true,
      });
      expect(room.codigoSala).toMatch(/^[A-Za-z0-9]{8}$/);
    });

    it('refuses a tutor id sent in the body', async () => {
      await api(app, owner)
        .post('/salas', { ...NEW_ROOM, tutorId: colleague.id })
        .expect(400)
        .expect(({ body }) =>
          expect((body as { message: string[] }).message).toContain(
            'O campo "tutorId" não é permitido.',
          ),
        );
    });

    it('answers 400, not 500, for a semester made of spaces', async () => {
      await api(app, owner)
        .post('/salas', { ...NEW_ROOM, semestre: '   ' })
        .expect(400);
    });

    it('is forbidden to students', async () => {
      await api(app, student).post('/salas', NEW_ROOM).expect(403);
    });

    it('requires authentication', async () => {
      await api(app).post('/salas', NEW_ROOM).expect(401);
    });
  });

  describe('GET /salas', () => {
    it('lists only the rooms linked to the tutor', async () => {
      const room = await createRoom();

      const mine = await api(app, owner).get('/salas').expect(200);
      const theirs = await api(app, colleague).get('/salas').expect(200);

      expect((mine.body as RoomBody[]).map((r) => r.id)).toEqual([room.id]);
      expect(theirs.body).toEqual([]);
    });
  });

  describe('GET /salas/:id', () => {
    it('shows the room to a linked tutor', async () => {
      const room = await createRoom();
      await api(app, owner).post(`/salas/${room.id}/professores`, { professorId: colleague.id });

      const response = await api(app, colleague).get(`/salas/${room.id}`).expect(200);

      expect(response.body).toEqual(room);
    });

    it('is forbidden to a tutor not linked to the room', async () => {
      const room = await createRoom();

      await api(app, colleague).get(`/salas/${room.id}`).expect(403);
    });

    it('answers 404 for a deleted room', async () => {
      const room = await createRoom();
      await api(app, owner).delete(`/salas/${room.id}`).expect(204);

      await api(app, owner).get(`/salas/${room.id}`).expect(404);
    });

    it('answers 400 for an id that is not a UUID', async () => {
      await api(app, owner).get('/salas/abc').expect(400);
    });
  });

  describe('PATCH /salas/:id', () => {
    it('updates the informed fields', async () => {
      const room = await createRoom();

      const response = await api(app, owner)
        .patch(`/salas/${room.id}`, { nome: 'Sala Nova', ativo: false })
        .expect(200);

      expect(response.body).toMatchObject({ id: room.id, nome: 'Sala Nova', ativo: false });
    });

    it('rejects an empty name', async () => {
      const room = await createRoom();

      await api(app, owner).patch(`/salas/${room.id}`, { nome: '' }).expect(400);
    });

    it('answers 400 for an id that is not a UUID', async () => {
      await api(app, owner).patch('/salas/abc', { nome: 'x' }).expect(400);
    });

    it('is forbidden to a tutor not linked to the room', async () => {
      const room = await createRoom();

      await api(app, colleague).patch(`/salas/${room.id}`, { nome: 'x' }).expect(403);
    });
  });

  describe('DELETE /salas/:id', () => {
    it('soft deletes the room and hides it afterwards', async () => {
      const room = await createRoom();

      await api(app, owner).delete(`/salas/${room.id}`).expect(204);

      expect(await deletedAtOf(room.id)).not.toBeNull();
      await api(app, owner).get('/salas').expect(200, []);
      await api(app, owner).patch(`/salas/${room.id}`, { ativo: true }).expect(404);
      await api(app, owner).delete(`/salas/${room.id}`).expect(404);
    });

    it('is forbidden to anyone but the owner, even a linked tutor', async () => {
      const room = await createRoom();
      await api(app, owner).post(`/salas/${room.id}/professores`, { professorId: colleague.id });

      await api(app, colleague).delete(`/salas/${room.id}`).expect(403);
      expect(await deletedAtOf(room.id)).toBeNull();
    });

    it('answers 404 for a room that does not exist', async () => {
      await api(app, owner).delete(`/salas/${MISSING_ID}`).expect(404);
    });
  });

  describe('tutors of a room', () => {
    it('adds and removes a tutor', async () => {
      const room = await createRoom();

      await api(app, owner)
        .post(`/salas/${room.id}/professores`, { professorId: colleague.id })
        .expect(201, { mensagem: 'Professor associado à sala com sucesso.' });
      await api(app, colleague).get('/salas').expect(200);

      await api(app, owner)
        .delete(`/salas/${room.id}/professores/${colleague.id}`)
        .expect(200, { mensagem: 'Professor removido da sala com sucesso.' });
    });

    it('answers 409 when the tutor is already linked', async () => {
      const room = await createRoom();
      const add = () =>
        api(app, owner).post(`/salas/${room.id}/professores`, { professorId: colleague.id });

      const results = await Promise.all([add(), add()]);

      expect(results.map((r) => r.status).sort()).toEqual([201, 409]);
    });

    it('refuses a student as tutor', async () => {
      const room = await createRoom();

      await api(app, owner)
        .post(`/salas/${room.id}/professores`, { professorId: student.id })
        .expect(404);
    });

    it('never removes the owner', async () => {
      const room = await createRoom();

      await api(app, owner).delete(`/salas/${room.id}/professores/${owner.id}`).expect(403);
    });

    it('does not manage tutors of a deleted room', async () => {
      const room = await createRoom();
      await api(app, owner).delete(`/salas/${room.id}`).expect(204);

      await api(app, owner)
        .post(`/salas/${room.id}/professores`, { professorId: colleague.id })
        .expect(404);
    });
  });
});
