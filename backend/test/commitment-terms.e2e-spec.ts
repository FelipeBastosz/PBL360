import type { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { UserType } from '@/users/domain/enums/user-type.enum';
import { createTestApp } from './helpers/create-test-app';
import { api, cleanDatabase, insertUser, type TestUser } from './helpers/fixtures';

interface TermAcceptancePayload {
  aceito: boolean;
  versaoAceita: string | null;
  aceitoEm: string | null;
  versaoVigente: string;
}

interface TermPayload {
  versao: string;
  titulo: string;
  texto: string;
}

interface CountRow {
  count: number;
}

describe('Commitment Terms (e2e)', () => {
  let app: INestApplication;
  let database: DataSource;
  let tutorWithoutAcceptance: TestUser;
  let studentWithoutAcceptance: TestUser;

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
    tutorWithoutAcceptance = await insertUser(
      app,
      database,
      'tutor@uefs.br',
      UserType.TUTOR,
      false,
    );
    studentWithoutAcceptance = await insertUser(
      app,
      database,
      'aluno@discente.uefs.br',
      UserType.STUDENT,
      false,
    );
  });

  describe('GET /termos-compromisso/vigente', () => {
    it('allows public unauthenticated query and returns current term', async () => {
      const response = await api(app).get('/termos-compromisso/vigente').expect(200);
      const body = response.body as TermPayload;

      expect(body).toEqual({
        versao: '1.0',
        titulo: 'Termo de Compromisso e Uso do Sistema PBL360',
        texto: expect.stringContaining('PBL360') as string,
      });
    });
  });

  describe('GET /usuarios/meu-aceite-termo', () => {
    it('returns 401 when request is not authenticated', async () => {
      await api(app).get('/usuarios/meu-aceite-termo').expect(401);
    });

    it('returns null acceptance fields for accounts without acceptance', async () => {
      const response = await api(app, tutorWithoutAcceptance)
        .get('/usuarios/meu-aceite-termo')
        .expect(200);

      expect(response.body).toEqual({
        aceito: false,
        versaoAceita: null,
        aceitoEm: null,
        versaoVigente: '1.0',
      });
    });
  });

  describe('Access blocking before acceptance', () => {
    it('blocks business features with 403 before acceptance for tutor', async () => {
      const response = await api(app, tutorWithoutAcceptance)
        .get('/usuarios/meu-perfil')
        .expect(403);

      expect(response.body).toHaveProperty(
        'message',
        'É necessário aceitar o termo de compromisso para acessar o sistema.',
      );
    });

    it('blocks business features with 403 before acceptance for student', async () => {
      const response = await api(app, studentWithoutAcceptance)
        .get('/usuarios/meu-perfil')
        .expect(403);

      expect(response.body).toHaveProperty(
        'message',
        'É necessário aceitar o termo de compromisso para acessar o sistema.',
      );
    });
  });

  describe('POST /usuarios/meu-aceite-termo', () => {
    it('returns 401 when request is unauthenticated', async () => {
      await api(app).post('/usuarios/meu-aceite-termo').send({ versao: '1.0' }).expect(401);
    });

    it('returns 400 when body is invalid', async () => {
      await api(app, tutorWithoutAcceptance)
        .post('/usuarios/meu-aceite-termo')
        .send({ versao: '' })
        .expect(400);
    });

    it('returns 409 when version is outdated on first acceptance', async () => {
      await api(app, tutorWithoutAcceptance)
        .post('/usuarios/meu-aceite-termo')
        .send({ versao: '0.9' })
        .expect(409);
    });

    it('successfully registers first acceptance and unlocks business features', async () => {
      const acceptResponse = await api(app, tutorWithoutAcceptance)
        .post('/usuarios/meu-aceite-termo')
        .send({ versao: '1.0' })
        .expect(200);

      expect(acceptResponse.body).toEqual({
        aceito: true,
        versaoAceita: '1.0',
        aceitoEm: expect.any(String) as string,
        versaoVigente: '1.0',
      });

      const statusResponse = await api(app, tutorWithoutAcceptance)
        .get('/usuarios/meu-aceite-termo')
        .expect(200);
      const statusBody = statusResponse.body as TermAcceptancePayload;

      expect(statusBody.aceito).toBe(true);
      expect(statusBody.versaoAceita).toBe('1.0');

      await api(app, tutorWithoutAcceptance).get('/usuarios/meu-perfil').expect(200);
    });

    it('handles repeated acceptance idempotently without changing original date', async () => {
      const first = await api(app, tutorWithoutAcceptance)
        .post('/usuarios/meu-aceite-termo')
        .send({ versao: '1.0' })
        .expect(200);
      const firstBody = first.body as TermAcceptancePayload;
      const firstDate = firstBody.aceitoEm;

      const second = await api(app, tutorWithoutAcceptance)
        .post('/usuarios/meu-aceite-termo')
        .send({ versao: '1.0' })
        .expect(200);
      const secondBody = second.body as TermAcceptancePayload;

      expect(secondBody.aceitoEm).toBe(firstDate);

      const rows = await database.query<CountRow[]>(
        'SELECT count(*)::int AS count FROM user_term_acceptances WHERE user_id = $1;',
        [tutorWithoutAcceptance.id],
      );
      expect(Number(rows[0]?.count)).toBe(1);
    });
  });
});
