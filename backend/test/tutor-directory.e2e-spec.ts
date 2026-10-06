import type { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { UserType } from '@/users/domain/enums/user-type.enum';
import { createTestApp } from './helpers/create-test-app';
import { api, cleanDatabase, insertUser, type TestUser } from './helpers/fixtures';

const MISSING_ID = '00000000-0000-4000-8000-000000000000';
const NEW_ROOM = { nome: 'Sala de Teste', codigoDisciplina: 'EXA123', semestre: '2026.2' };

interface TutorBody {
  id: string;
  nome: string;
  email: string;
  responsavel?: boolean;
}

describe('Tutor directory (e2e)', () => {
  let app: INestApplication;
  let database: DataSource;
  let owner: TestUser;
  let colleague: TestUser;
  let outsider: TestUser;
  let student: TestUser;
  let roomId: string;

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
    owner = await insertUser(app, database, 'owner@uefs.br');
    colleague = await insertUser(app, database, 'colleague@uefs.br');
    outsider = await insertUser(app, database, 'outside@uefs.br');
    student = await insertUser(app, database, 'student@discente.uefs.br', UserType.STUDENT);
    await database.query('UPDATE users SET name = $1 WHERE id = $2', ['Zoe', owner.id]);
    await database.query('UPDATE users SET name = $1 WHERE id = $2', ['Ana', colleague.id]);
    const response = await api(app, owner).post('/salas', NEW_ROOM).expect(201);
    roomId = (response.body as { id: string }).id;
    await api(app, owner)
      .post(`/salas/${roomId}/professores`, { professorId: colleague.id })
      .expect(201);
  });

  it('lists only linked tutors with the owner first and only public fields', async () => {
    const other = await api(app, outsider).post('/salas', NEW_ROOM).expect(201);
    expect((other.body as { id: string }).id).not.toBe(roomId);
    const response = await api(app, owner).get(`/salas/${roomId}/professores`).expect(200);
    expect(response.body).toEqual([
      { id: owner.id, nome: 'Zoe', email: owner.email, responsavel: true },
      { id: colleague.id, nome: 'Ana', email: colleague.email, responsavel: false },
    ]);
  });

  it('allows an associated tutor to list the room tutors', async () => {
    const response = await api(app, colleague).get(`/salas/${roomId}/professores`).expect(200);
    expect((response.body as TutorBody[]).map(({ id }) => id)).toEqual([owner.id, colleague.id]);
  });

  it('rejects a tutor outside the room', async () => {
    await api(app, outsider).get(`/salas/${roomId}/professores`).expect(403);
  });

  it('lets an enrolled student list the room tutors', async () => {
    await database.query('INSERT INTO room_students (room_id, student_id) VALUES ($1, $2);', [
      roomId,
      student.id,
    ]);

    const response = await api(app, student).get(`/salas/${roomId}/professores`).expect(200);
    expect((response.body as TutorBody[]).map(({ id }) => id)).toEqual([owner.id, colleague.id]);
  });

  it('rejects students outside the room', async () => {
    await api(app, student).get(`/salas/${roomId}/professores`).expect(403);
  });

  it('requires authentication for the room list', async () => {
    await api(app).get(`/salas/${roomId}/professores`).expect(401);
  });

  it('rejects invalid room identifiers', async () => {
    await api(app, owner).get('/salas/invalid/professores').expect(400);
  });

  it('reports missing rooms', async () => {
    await api(app, owner).get(`/salas/${MISSING_ID}/professores`).expect(404);
  });

  it('hides deleted rooms', async () => {
    await api(app, owner).delete(`/salas/${roomId}`).expect(204);
    await api(app, owner).get(`/salas/${roomId}/professores`).expect(404);
  });

  it('searches email fragments without case sensitivity and exposes only public fields', async () => {
    const response = await api(app, owner)
      .get('/usuarios/professores?busca=%20COLLEAGUE%20')
      .expect(200);
    expect(response.body).toEqual([{ id: colleague.id, nome: 'Ana', email: colleague.email }]);
  });

  it('finds a tutor by the full email', async () => {
    const response = await api(app, owner)
      .get('/usuarios/professores?busca=colleague%40uefs.br')
      .expect(200);
    expect((response.body as TutorBody[]).map(({ id }) => id)).toEqual([colleague.id]);
  });

  it('excludes students whose email matches', async () => {
    await api(app, owner).get('/usuarios/professores?busca=student').expect(200, []);
  });

  it('returns an empty list for an unmatched email fragment', async () => {
    await api(app, owner).get('/usuarios/professores?busca=nobody').expect(200, []);
  });

  it.each([
    '',
    '?busca=',
    '?busca=ab',
    '?busca=%20%20%20',
    `?busca=${'a'.repeat(161)}`,
    '?busca=owner&extra=value',
    '?busca=owner&busca=colleague',
  ])('rejects invalid search %s', async (query) => {
    await api(app, owner).get(`/usuarios/professores${query}`).expect(400);
  });

  it('treats SQL wildcards as literal characters', async () => {
    await api(app, owner).get('/usuarios/professores?busca=%25_%25').expect(200, []);
  });

  it('does not execute SQL supplied in the search', async () => {
    const query = encodeURIComponent("' OR 1=1 --");
    await api(app, owner).get(`/usuarios/professores?busca=${query}`).expect(200, []);
  });

  it('limits results to twenty in stable order', async () => {
    await database.query(`INSERT INTO users (name, email, password_hash, type, active)
      SELECT 'Tutor ' || lpad(n::text, 2, '0'), 'limit' || n || '@uefs.br', 'hash', 'TUTOR', true
      FROM generate_series(1, 25) AS n`);
    const response = await api(app, owner).get('/usuarios/professores?busca=limit').expect(200);
    const tutors = response.body as TutorBody[];
    expect(tutors).toHaveLength(20);
    expect(tutors.map(({ nome }) => nome)).toEqual(
      Array.from({ length: 20 }, (_, index) => `Tutor ${String(index + 1).padStart(2, '0')}`),
    );
  });

  it('rejects students from the search', async () => {
    await api(app, student).get('/usuarios/professores?busca=owner').expect(403);
  });

  it('requires authentication for the search', async () => {
    await api(app).get('/usuarios/professores?busca=owner').expect(401);
  });
});
