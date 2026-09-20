import { ValidationPipe, type INestApplication } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { type Server } from 'node:http';
import { AppModule } from '@/app.module';
import { DomainExceptionFilter } from '@/shared/filters/domain-exception.filter';
import { EMAIL_VERIFICATION_SENDER } from '@/auth/domain/services/email-verification-sender';

const REGISTER = '/api/autenticacao/registro';
const LOGIN = '/api/autenticacao/login';

jest.setTimeout(30000);

interface SessionResponse {
  mensagem?: string;
  token: string;
  expiraEm: string;
  usuario: {
    id: string;
    nome: string;
    email: string;
    tipo: string;
    matricula: string | null;
    fotoUrl: string | null;
    ativo: boolean;
    criadoEm: string;
  };
}

interface ErrorResponse {
  statusCode: number;
  message: string | string[];
  error: string;
}

const studentPayload = () => ({
  nome: 'Ana Souza',
  email: 'ana@discente.uefs.br',
  senha: 'senha-secreta',
  tipo: 'ALUNO',
  matricula: '20240001',
  fotoUrl: 'https://example.com/ana.png',
});

const tutorPayload = () => ({
  nome: 'Carlos Mendes',
  email: 'carlos@uefs.br',
  senha: 'senha-secreta',
  tipo: 'PROFESSOR',
});

describe('Auth (e2e)', () => {
  let moduleRef: TestingModule;
  let app: INestApplication;
  let dataSource: DataSource;

  const post = (path: string, payload: object) =>
    request(app.getHttpServer() as Server)
      .post(path)
      .send(payload);

  const register = async (payload: object, status = 201): Promise<SessionResponse> => {
    const response = await post(REGISTER, payload).expect(status);
    return response.body as SessionResponse;
  };

  const errorOf = async (path: string, payload: object, status: number): Promise<ErrorResponse> => {
    const response = await post(path, payload).expect(status);
    return response.body as ErrorResponse;
  };

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(EMAIL_VERIFICATION_SENDER)
      .useValue({
        sendVerificationCode: jest.fn().mockResolvedValue(undefined),
      })
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    app.useGlobalFilters(new DomainExceptionFilter());
    await app.init();

    dataSource = moduleRef.get(DataSource);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await dataSource.query('DELETE FROM email_verification_codes;');
    await dataSource.query('DELETE FROM users;');
  });

  describe(`POST ${REGISTER}`, () => {
    it('registers a student and answers with a token', async () => {
      const body = await register(studentPayload());

      expect(body.token).toEqual(expect.any(String));
      expect(body.expiraEm).toEqual(expect.any(String));
      expect(body.mensagem).toContain('código de verificação');
    });

    it('answers with the Portuguese contract and never the password', async () => {
      const body = await register(studentPayload());

      expect(body.usuario).toMatchObject({
        nome: 'Ana Souza',
        email: 'ana@discente.uefs.br',
        tipo: 'ALUNO',
        matricula: '20240001',
        fotoUrl: 'https://example.com/ana.png',
        ativo: true,
      });
      expect(JSON.stringify(body)).not.toContain('senha-secreta');
    });

    it('registers a tutor without photo and registration number', async () => {
      const body = await register(tutorPayload());

      expect(body.usuario).toMatchObject({ tipo: 'PROFESSOR', matricula: null, fotoUrl: null });
    });

    it('rejects an e-mail outside the university domains', async () => {
      const body = await errorOf(REGISTER, { ...tutorPayload(), email: 'carlos@gmail.com' }, 400);

      expect(body.message).toContain(
        'O e-mail deve ser institucional (@uefs.br ou @discente.uefs.br).',
      );
    });

    it('rejects a student without registration number and photo', async () => {
      const { matricula: _matricula, fotoUrl: _fotoUrl, ...incomplete } = studentPayload();

      const body = await errorOf(REGISTER, incomplete, 400);

      expect(body.message).toEqual(
        expect.arrayContaining([
          'A matrícula é obrigatória para alunos.',
          'A foto é obrigatória para alunos.',
        ]),
      );
    });

    it('rejects a registration number that is not eight digits', async () => {
      const body = await errorOf(REGISTER, { ...studentPayload(), matricula: '2024' }, 400);

      expect(body.message).toContain('A matrícula deve conter exatamente 8 dígitos.');
    });

    it('rejects an unknown field', async () => {
      await errorOf(REGISTER, { ...tutorPayload(), campoInexistente: 1 }, 400);
    });

    it('rejects an e-mail that is already registered', async () => {
      await register(studentPayload());

      const body = await errorOf(REGISTER, studentPayload(), 409);

      expect(body.message).toBe('Já existe uma conta cadastrada com este e-mail.');
    });
  });

  describe(`POST ${LOGIN}`, () => {
    beforeEach(async () => {
      await register(studentPayload());
    });

    it('answers 200 with a token for valid credentials', async () => {
      const response = await post(LOGIN, {
        email: 'ANA@discente.uefs.br',
        senha: 'senha-secreta',
      }).expect(200);
      const body = response.body as SessionResponse;

      expect(body.token).toEqual(expect.any(String));
      expect(body.usuario.email).toBe('ana@discente.uefs.br');
    });

    it('rejects a wrong password', async () => {
      const credentials = { email: 'ana@discente.uefs.br', senha: 'senha-errada' };

      const body = await errorOf(LOGIN, credentials, 401);

      expect(body.message).toBe('E-mail ou senha inválidos.');
    });

    it('rejects an e-mail that is not registered', async () => {
      const credentials = { email: 'ninguem@uefs.br', senha: 'senha-secreta' };

      const body = await errorOf(LOGIN, credentials, 401);

      expect(body.message).toBe('E-mail ou senha inválidos.');
    });

    it('rejects a payload missing the password', async () => {
      await errorOf(LOGIN, { email: 'ana@discente.uefs.br' }, 400);
    });
  });
});
