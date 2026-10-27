import type { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { UserType } from '@/users/domain/enums/user-type.enum';
import { createTestApp } from './helpers/create-test-app';
import { api, cleanDatabase, insertUser, type TestUser } from './helpers/fixtures';

const CREATED_CODES = ['EXA999', 'TEC777'];

describe('Disciplines (e2e)', () => {
  let app: INestApplication;
  let database: DataSource;
  let tutor: TestUser;
  let student: TestUser;

  beforeAll(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
    database = testApp.moduleRef.get(DataSource);
  });

  afterAll(async () => {
    if (database) await cleanDatabase(database);
    if (app) await app.close();
  });

  afterEach(async () => {
    await database.query('DELETE FROM disciplines WHERE code = ANY($1);', [CREATED_CODES]);
  });

  beforeEach(async () => {
    await cleanDatabase(database);
    tutor = await insertUser(app, database, 'tutor@uefs.br');
    student = await insertUser(app, database, 'aluno@discente.uefs.br', UserType.STUDENT);
  });

  describe('GET /disciplinas', () => {
    it('lists every integrator module of computer engineering ordered by code', async () => {
      const response = await api(app, tutor).get('/disciplinas').expect(200);

      expect(response.body).toEqual([
        { id: expect.any(String) as string, codigo: 'EXA613', nome: 'MI Engenharia de Software' },
        { id: expect.any(String) as string, codigo: 'EXA854', nome: 'MI Algoritmos' },
        { id: expect.any(String) as string, codigo: 'EXA863', nome: 'MI Programação' },
        {
          id: expect.any(String) as string,
          codigo: 'TEC498',
          nome: 'MI Projeto de Circuitos Digitais',
        },
        { id: expect.any(String) as string, codigo: 'TEC499', nome: 'MI Sistemas Digitais' },
        {
          id: expect.any(String) as string,
          codigo: 'TEC502',
          nome: 'MI Concorrência e Conectividade',
        },
        {
          id: expect.any(String) as string,
          codigo: 'TEC506',
          nome: 'MI Projetos de Circuitos Eletrônicos',
        },
        {
          id: expect.any(String) as string,
          codigo: 'TEC513',
          nome: 'MI Processamento Digital de Sinais',
        },
      ]);
    });

    it('rejects students and anonymous requests', async () => {
      await api(app, student).get('/disciplinas').expect(403);
      await api(app).get('/disciplinas').expect(401);
    });
  });

  describe('POST /disciplinas', () => {
    it('registers a new discipline that becomes available in the list', async () => {
      const response = await api(app, tutor)
        .post('/disciplinas', { codigo: ' exa999 ', nome: '  MI Nova Disciplina ' })
        .expect(201);

      expect(response.body).toEqual({
        id: expect.any(String) as string,
        codigo: 'EXA999',
        nome: 'MI Nova Disciplina',
      });
      const list = await api(app, tutor).get('/disciplinas').expect(200);
      expect(list.body).toContainEqual(response.body);
    });

    it('returns conflict when the code is already registered, regardless of case', async () => {
      const response = await api(app, tutor)
        .post('/disciplinas', { codigo: 'exa863', nome: 'Outra Programação' })
        .expect(409);

      expect((response.body as { message: string }).message).toBe(
        'Já existe uma disciplina com o código EXA863.',
      );
    });

    it('returns conflict when two tutors register the same code at the same time', async () => {
      const otherTutor = await insertUser(app, database, 'outro@uefs.br');
      const statuses = await Promise.all(
        [tutor, otherTutor].map(async (user) => {
          const response = await api(app, user).post('/disciplinas', {
            codigo: 'TEC777',
            nome: 'MI Concorrente',
          });
          return response.status;
        }),
      );

      expect(statuses.sort()).toEqual([201, 409]);
    });

    it.each([
      [{ codigo: 'EX99', nome: 'MI Nova' }, 'O código da disciplina deve seguir o formato ABC123.'],
      [{ codigo: 'EXA999', nome: '   ' }, 'O nome da disciplina é obrigatório.'],
      [
        { codigo: 'EXA999', nome: 'a'.repeat(121) },
        'O nome da disciplina deve ter no máximo 120 caracteres.',
      ],
    ])('rejects an invalid payload %j', async (payload, message) => {
      const response = await api(app, tutor).post('/disciplinas', payload).expect(400);

      expect(JSON.stringify(response.body)).toContain(message);
    });

    it('rejects students and anonymous requests', async () => {
      const payload = { codigo: 'EXA999', nome: 'MI Nova' };
      await api(app, student).post('/disciplinas', payload).expect(403);
      await api(app).post('/disciplinas', payload).expect(401);
    });
  });
});
