import type { Server } from 'node:http';
import type { INestApplication } from '@nestjs/common';
import { hash } from 'bcrypt';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { UserThemePayload } from '@/users/application/dtos/user-theme-payload.enum';
import { DEFAULT_SYSTEM_COLOR } from '@/users/domain/entities/user-preferences.entity';
import { UserType } from '@/users/domain/enums/user-type.enum';
import { createTestApp } from './helpers/create-test-app';
import { api, cleanDatabase, insertUser, signAccessToken, type TestUser } from './helpers/fixtures';

jest.setTimeout(30000);

interface OpenApiResponse {
  content?: Record<string, { example?: Record<string, unknown> }>;
}

interface OpenApiDocument {
  paths: Record<
    string,
    Record<string, { tags?: string[]; responses: Record<string, OpenApiResponse> }>
  >;
  components: {
    schemas: Record<string, { properties: Record<string, unknown> }>;
  };
}

interface RawUserRow {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  registrationNumber: string | null;
  type: UserType;
  active: boolean;
  tokenVersion: number;
}

describe('User preferences (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let tutor: TestUser;
  let otherTutor: TestUser;
  let student: TestUser;

  beforeAll(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
    dataSource = testApp.moduleRef.get(DataSource);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await cleanDatabase(dataSource);
    tutor = await insertUser(app, dataSource, 'carlos@uefs.br', UserType.TUTOR);
    otherTutor = await insertUser(app, dataSource, 'maria@uefs.br', UserType.TUTOR);
    student = await insertUser(app, dataSource, '20240001@discente.uefs.br', UserType.STUDENT);
  });

  describe('Authentication', () => {
    it('returns 401 for GET and PUT without token', async () => {
      await api(app).get('/usuarios/minhas-preferencias').expect(401);
      await api(app)
        .put('/usuarios/minhas-preferencias', { tema: UserThemePayload.ESCURO })
        .expect(401);
    });

    it('returns 401 for GET and PUT with invalid token', async () => {
      const server = request(app.getHttpServer() as Server);

      await server
        .get('/api/usuarios/minhas-preferencias')
        .set('Authorization', 'Bearer token-invalido')
        .expect(401);

      await server
        .put('/api/usuarios/minhas-preferencias')
        .set('Authorization', 'Bearer token-invalido')
        .send({ tema: UserThemePayload.ESCURO })
        .expect(401);
    });
  });

  describe('GET /usuarios/minhas-preferencias', () => {
    it('returns system defaults on first GET for both tutor and student', async () => {
      const tutorRes = await api(app, tutor).get('/usuarios/minhas-preferencias').expect(200);
      const studentRes = await api(app, student).get('/usuarios/minhas-preferencias').expect(200);

      expect(tutorRes.body).toEqual({
        tema: UserThemePayload.CLARO,
        cor: DEFAULT_SYSTEM_COLOR,
      });
      expect(studentRes.body).toEqual({
        tema: UserThemePayload.CLARO,
        cor: DEFAULT_SYSTEM_COLOR,
      });
    });
  });

  describe('PUT /usuarios/minhas-preferencias', () => {
    it('updates theme only on first write, preserves defaults, and then updates color preserving theme', async () => {
      const first = await api(app, tutor)
        .put('/usuarios/minhas-preferencias', { tema: UserThemePayload.ESCURO })
        .expect(200);

      expect(first.body).toEqual({
        tema: UserThemePayload.ESCURO,
        cor: DEFAULT_SYSTEM_COLOR,
      });

      const second = await api(app, tutor)
        .put('/usuarios/minhas-preferencias', { cor: '#ff00aa' })
        .expect(200);

      expect(second.body).toEqual({
        tema: UserThemePayload.ESCURO,
        cor: '#FF00AA',
      });

      const fetched = await api(app, tutor).get('/usuarios/minhas-preferencias').expect(200);
      expect(fetched.body).toEqual({
        tema: UserThemePayload.ESCURO,
        cor: '#FF00AA',
      });
    });

    it('updates color only on first write for student and restores default system color', async () => {
      const first = await api(app, student)
        .put('/usuarios/minhas-preferencias', { cor: '#1e88e5' })
        .expect(200);

      expect(first.body).toEqual({
        tema: UserThemePayload.CLARO,
        cor: '#1E88E5',
      });

      const both = await api(app, student)
        .put('/usuarios/minhas-preferencias', {
          tema: UserThemePayload.ESCURO,
          cor: '#2e7d32',
        })
        .expect(200);

      expect(both.body).toEqual({
        tema: UserThemePayload.ESCURO,
        cor: '#2E7D32',
      });

      const restored = await api(app, student)
        .put('/usuarios/minhas-preferencias', { cor: DEFAULT_SYSTEM_COLOR })
        .expect(200);

      expect(restored.body).toEqual({
        tema: UserThemePayload.ESCURO,
        cor: DEFAULT_SYSTEM_COLOR,
      });
    });

    it.each([
      ['invalid theme', { tema: 'AZUL' }],
      ['lowercase theme', { tema: 'escuro' }],
      ['explicit null theme', { tema: null }],
      ['3-digit hex color', { cor: '#fff' }],
      ['color without hash', { cor: '112233' }],
      ['invalid hex characters', { cor: '#GGGGGG' }],
      ['empty color', { cor: '' }],
      ['color name', { cor: 'blue' }],
      ['color with spaces', { cor: ' #112233' }],
      ['explicit null color', { cor: null }],
      ['extra usuarioId field', { tema: UserThemePayload.ESCURO, usuarioId: 'other-id' }],
      ['extra userId field', { cor: '#112233', userId: 'other-id' }],
      ['extra id field', { id: 'other-id' }],
    ])('rejects %s with 400 and preserves previous preferences', async (_label, payload) => {
      await api(app, tutor)
        .put('/usuarios/minhas-preferencias', {
          tema: UserThemePayload.ESCURO,
          cor: '#112233',
        })
        .expect(200);

      await api(app, tutor).put('/usuarios/minhas-preferencias', payload).expect(400);

      const current = await api(app, tutor).get('/usuarios/minhas-preferencias').expect(200);
      expect(current.body).toEqual({
        tema: UserThemePayload.ESCURO,
        cor: '#112233',
      });
    });
  });

  describe('Persistence, isolation and profile integrity', () => {
    it('persists preferences across a new real login and fresh access token', async () => {
      const passwordHash = await hash('SenhaForte123!', 4);
      await dataSource.query(`UPDATE users SET password_hash = $2 WHERE id = $1;`, [
        student.id,
        passwordHash,
      ]);

      await api(app, student)
        .put('/usuarios/minhas-preferencias', {
          tema: UserThemePayload.ESCURO,
          cor: '#00a86b',
        })
        .expect(200);

      const loginResponse = await api(app)
        .post('/autenticacao/login', { email: student.email, senha: 'SenhaForte123!' })
        .expect(200);

      const { token } = loginResponse.body as { token: string };
      const afterRealLogin = await api(app, { ...student, token })
        .get('/usuarios/minhas-preferencias')
        .expect(200);

      expect(afterRealLogin.body).toEqual({
        tema: UserThemePayload.ESCURO,
        cor: '#00A86B',
      });

      const freshToken = signAccessToken(app, student.id, student.email, student.type);
      const afterFreshToken = await api(app, { ...student, token: freshToken })
        .get('/usuarios/minhas-preferencias')
        .expect(200);

      expect(afterFreshToken.body).toEqual({
        tema: UserThemePayload.ESCURO,
        cor: '#00A86B',
      });
    });

    it('isolates preferences strictly per account and blocks attempts to alter another user', async () => {
      await api(app, tutor)
        .put('/usuarios/minhas-preferencias', {
          tema: UserThemePayload.ESCURO,
          cor: '#AA1122',
        })
        .expect(200);

      const studentPrefs = await api(app, student).get('/usuarios/minhas-preferencias').expect(200);
      const otherTutorPrefs = await api(app, otherTutor)
        .get('/usuarios/minhas-preferencias')
        .expect(200);

      expect(studentPrefs.body).toEqual({
        tema: UserThemePayload.CLARO,
        cor: DEFAULT_SYSTEM_COLOR,
      });
      expect(otherTutorPrefs.body).toEqual({
        tema: UserThemePayload.CLARO,
        cor: DEFAULT_SYSTEM_COLOR,
      });

      await api(app, tutor)
        .put('/usuarios/minhas-preferencias', {
          usuarioId: student.id,
          tema: UserThemePayload.ESCURO,
          cor: '#990000',
        })
        .expect(400);

      const studentAfterAttempt = await api(app, student)
        .get('/usuarios/minhas-preferencias')
        .expect(200);

      expect(studentAfterAttempt.body).toEqual({
        tema: UserThemePayload.CLARO,
        cor: DEFAULT_SYSTEM_COLOR,
      });
    });

    it('does not modify profile, credentials or role data when updating preferences', async () => {
      const profileBefore = await api(app, student).get('/usuarios/meu-perfil').expect(200);
      const [rowBefore] = await dataSource.query<RawUserRow[]>(
        `SELECT id, name, email, password_hash AS "passwordHash",
                registration_number AS "registrationNumber", type, active,
                token_version AS "tokenVersion"
         FROM users WHERE id = $1;`,
        [student.id],
      );

      await api(app, student)
        .put('/usuarios/minhas-preferencias', {
          tema: UserThemePayload.ESCURO,
          cor: '#334455',
        })
        .expect(200);

      const profileAfter = await api(app, student).get('/usuarios/meu-perfil').expect(200);
      const [rowAfter] = await dataSource.query<RawUserRow[]>(
        `SELECT id, name, email, password_hash AS "passwordHash",
                registration_number AS "registrationNumber", type, active,
                token_version AS "tokenVersion"
         FROM users WHERE id = $1;`,
        [student.id],
      );

      expect(profileAfter.body).toEqual(profileBefore.body);
      expect(rowAfter).toEqual(rowBefore);
    });
  });

  describe('Swagger documentation', () => {
    it('documents GET and PUT /api/usuarios/minhas-preferencias and their DTO schemas', async () => {
      const response = await request(app.getHttpServer() as Server)
        .get('/api/docs/json')
        .expect(200);
      const document = response.body as OpenApiDocument;
      const path = document.paths['/api/usuarios/minhas-preferencias'];

      expect(path).toBeDefined();
      expect(path!.get!.tags).toEqual(['Usuários']);
      expect(Object.keys(path!.get!.responses)).toEqual(expect.arrayContaining(['200', '401']));
      expect(path!.put!.tags).toEqual(['Usuários']);
      expect(Object.keys(path!.put!.responses)).toEqual(
        expect.arrayContaining(['200', '400', '401']),
      );
      expect(path!.get!.responses['401']!.content!['application/json']!.example).toEqual({
        statusCode: 401,
        message: 'Token de autenticação inválido ou expirado.',
        error: 'Unauthorized',
      });
      expect(path!.put!.responses['401']!.content!['application/json']!.example).toEqual({
        statusCode: 401,
        message: 'Token de autenticação inválido ou expirado.',
        error: 'Unauthorized',
      });
      expect(path!.put!.responses['400']!.content!['application/json']!.example).toEqual({
        statusCode: 400,
        message: [
          'O tema deve ser CLARO ou ESCURO.',
          'A cor deve estar no formato hexadecimal completo #RRGGBB.',
        ],
        error: 'Bad Request',
      });
      expect(Object.keys(document.components.schemas.UpdateUserPreferencesDto!.properties)).toEqual(
        ['tema', 'cor'],
      );
      expect(
        Object.keys(document.components.schemas.UserPreferencesResponseDto!.properties),
      ).toEqual(['tema', 'cor']);
    });
  });
});
