import type { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { UserType } from '@/users/domain/enums/user-type.enum';
import { createTestApp } from './helpers/create-test-app';
import { api, cleanDatabase, insertUser, type TestUser } from './helpers/fixtures';

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
});
