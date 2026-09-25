import { type INestApplication } from '@nestjs/common';
import { type TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { type Server } from 'node:http';
import { EMAIL_VERIFICATION_SENDER } from '@/auth/domain/services/email-verification-sender';
import { PASSWORD_RESET_SENDER } from '@/auth/domain/services/password-reset-sender';
import { IdentityThrottlerGuard } from '@/shared/throttling/identity-throttler.guard';
import { createTestApp } from './helpers/create-test-app';

const REGISTER = '/api/autenticacao/registro';
const LOGIN = '/api/autenticacao/login';
const VERIFY = '/api/autenticacao/verificar-codigo';
const RESEND = '/api/autenticacao/reenviar-codigo';
const RESET_REQUEST = '/api/autenticacao/recuperacao-senha';
const RESET_VALIDATE = '/api/autenticacao/recuperacao-senha/validar-codigo';
const RESET_PASSWORD = '/api/autenticacao/redefinir-senha';

const CODE_RESENT =
  'Se houver uma conta pendente de verificação com este e-mail, enviamos um novo código.';

const PASSWORD_RESET_REQUESTED =
  'Se houver uma conta com este e-mail, enviamos um código de recuperação de senha.';

const PENDING_VERIFICATION =
  'Confirme o código enviado para o seu e-mail institucional para ativar a conta.';

jest.setTimeout(30000);

interface UserResponse {
  id: string;
  nome: string;
  email: string;
  tipo: string;
  matricula: string | null;
  fotoUrl: string | null;
  ativo: boolean;
  criadoEm: string;
}

interface SessionResponse {
  mensagem?: string;
  token: string;
  expiraEm: string;
  usuario: UserResponse;
}

interface RegisterResponse {
  mensagem: string;
  usuarioId: string;
  usuario: UserResponse;
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

  const register = async (payload: object, status = 201): Promise<RegisterResponse> => {
    const response = await post(REGISTER, payload).expect(status);
    return response.body as RegisterResponse;
  };

  const ageCodesOf = async (userId: string, seconds: number): Promise<void> => {
    await dataSource.query(
      `UPDATE email_verification_codes
        SET created_at = NOW() - ($2 || ' seconds')::interval
        WHERE user_id = $1;`,
      [userId, seconds],
    );
  };

  const countPendingCodes = async (userId: string): Promise<number> => {
    const [{ total }] = await dataSource.query<[{ total: number }]>(
      `SELECT COUNT(*)::int AS total FROM email_verification_codes
        WHERE user_id = $1 AND used_at IS NULL;`,
      [userId],
    );
    return total;
  };

  const pendingCodeOf = async (userId: string): Promise<string> => {
    const [row] = await dataSource.query<[{ code: string }]>(
      `SELECT code FROM email_verification_codes
        WHERE user_id = $1 AND used_at IS NULL
        ORDER BY created_at DESC LIMIT 1;`,
      [userId],
    );
    return row.code;
  };

  const ageResetCodesOf = async (userId: string, seconds: number): Promise<void> => {
    await dataSource.query(
      `UPDATE password_reset_codes
        SET created_at = NOW() - ($2 || ' seconds')::interval
        WHERE user_id = $1;`,
      [userId, seconds],
    );
  };

  const expireResetCodesOf = async (userId: string): Promise<void> => {
    await dataSource.query(
      `UPDATE password_reset_codes
        SET expires_at = NOW() - interval '1 second'
        WHERE user_id = $1;`,
      [userId],
    );
  };

  const countPendingResetCodes = async (userId: string): Promise<number> => {
    const [{ total }] = await dataSource.query<[{ total: number }]>(
      `SELECT COUNT(*)::int AS total FROM password_reset_codes
        WHERE user_id = $1 AND used_at IS NULL;`,
      [userId],
    );
    return total;
  };

  const pendingResetCodeOf = async (userId: string): Promise<string> => {
    const [row] = await dataSource.query<[{ code: string }]>(
      `SELECT code FROM password_reset_codes
        WHERE user_id = $1 AND used_at IS NULL
        ORDER BY created_at DESC LIMIT 1;`,
      [userId],
    );
    return row.code;
  };

  const registerAndActivate = async (payload: object): Promise<RegisterResponse> => {
    const registered = await register(payload);

    await post(VERIFY, {
      usuarioId: registered.usuarioId,
      email: registered.usuario.email,
      codigo: await pendingCodeOf(registered.usuarioId),
    }).expect(200);

    return registered;
  };

  const errorOf = async (path: string, payload: object, status: number): Promise<ErrorResponse> => {
    const response = await post(path, payload).expect(status);
    return response.body as ErrorResponse;
  };

  beforeAll(async () => {
    ({ app, moduleRef } = await createTestApp((builder) =>
      builder
        .overrideProvider(EMAIL_VERIFICATION_SENDER)
        .useValue({ sendVerificationCode: jest.fn().mockResolvedValue(undefined) })
        .overrideProvider(PASSWORD_RESET_SENDER)
        .useValue({ sendResetCode: jest.fn().mockResolvedValue(undefined) })
        .overrideGuard(IdentityThrottlerGuard)
        .useValue({ canActivate: () => true }),
    ));

    dataSource = moduleRef.get(DataSource);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await dataSource.query('DELETE FROM email_verification_codes;');
    await dataSource.query('DELETE FROM password_reset_codes;');
    await dataSource.query('DELETE FROM users;');
  });

  describe(`POST ${REGISTER}`, () => {
    it('registers a student pending verification and answers with the user id', async () => {
      const body = await register(studentPayload());

      expect(body.usuarioId).toHaveLength(36);
      expect(body.usuarioId).toBe(body.usuario.id);
      expect(body.mensagem).toContain('código de verificação');
    });

    it('hands back no session token before the account is verified', async () => {
      const body = await register(studentPayload());

      expect(body).not.toHaveProperty('token');
      expect(body.usuario.ativo).toBe(false);
    });

    it('stores a pending code bound to the created user', async () => {
      const body = await register(studentPayload());

      const [row] = await dataSource.query<[{ userId: string; code: string }]>(
        `SELECT user_id AS "userId", code FROM email_verification_codes WHERE user_id = $1;`,
        [body.usuarioId],
      );

      expect(row.userId).toBe(body.usuarioId);
      expect(row.code).toMatch(/^\d{6}$/);
    });

    it('answers with the Portuguese contract and never the password', async () => {
      const body = await register(studentPayload());

      expect(body.usuario).toMatchObject({
        nome: 'Ana Souza',
        email: 'ana@discente.uefs.br',
        tipo: 'ALUNO',
        matricula: '20240001',
        fotoUrl: 'https://example.com/ana.png',
        ativo: false,
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
      await registerAndActivate(studentPayload());
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

    it('rejects an account that never confirmed its code', async () => {
      await register(tutorPayload());

      const body = await errorOf(LOGIN, { email: 'carlos@uefs.br', senha: 'senha-secreta' }, 403);

      expect(body.message).toBe(PENDING_VERIFICATION);
    });

    it('hands the pending account everything it needs to verify', async () => {
      const pending = await register(tutorPayload());

      const response = await post(LOGIN, {
        email: 'carlos@uefs.br',
        senha: 'senha-secreta',
      }).expect(403);

      expect(response.body).toMatchObject({
        statusCode: 403,
        motivo: 'CONTA_NAO_VERIFICADA',
        usuarioId: pending.usuarioId,
        email: 'carlos@uefs.br',
      });
    });

    it('lets the client finish the flow straight from the login answer', async () => {
      await register(tutorPayload());

      const blocked = await post(LOGIN, { email: 'carlos@uefs.br', senha: 'senha-secreta' }).expect(
        403,
      );
      const { usuarioId, email } = blocked.body as { usuarioId: string; email: string };

      await post(VERIFY, { usuarioId, email, codigo: await pendingCodeOf(usuarioId) }).expect(200);
      await post(LOGIN, { email: 'carlos@uefs.br', senha: 'senha-secreta' }).expect(200);
    });

    it('answers 401, not 403, when the password is wrong on a pending account', async () => {
      await register(tutorPayload());

      const body = await errorOf(LOGIN, { email: 'carlos@uefs.br', senha: 'errada' }, 401);

      expect(body.message).toBe('E-mail ou senha inválidos.');
    });
  });

  describe(`POST ${VERIFY}`, () => {
    let registered: RegisterResponse;
    let codigo: string;

    const verify = (overrides: object = {}) =>
      post(VERIFY, {
        usuarioId: registered.usuarioId,
        email: registered.usuario.email,
        codigo,
        ...overrides,
      });

    const activeFlagOf = async (id: string): Promise<boolean> => {
      const [row] = await dataSource.query<[{ active: boolean }]>(
        'SELECT active FROM users WHERE id = $1;',
        [id],
      );
      return row.active;
    };

    beforeEach(async () => {
      registered = await register(studentPayload());
      codigo = await pendingCodeOf(registered.usuarioId);
    });

    it('activates the account in the users table', async () => {
      await verify().expect(200);

      expect(await activeFlagOf(registered.usuarioId)).toBe(true);
    });

    it('answers with the session token of the activated account', async () => {
      const response = await verify().expect(200);
      const body = response.body as SessionResponse;

      expect(body.mensagem).toBe('Conta ativada com sucesso.');
      expect(body.token).toEqual(expect.any(String));
      expect(body.usuario).toMatchObject({ id: registered.usuarioId, ativo: true });
    });

    it('lets the activated account log in', async () => {
      await verify().expect(200);

      await post(LOGIN, { email: 'ana@discente.uefs.br', senha: 'senha-secreta' }).expect(200);
    });

    it('burns the code so it cannot be replayed', async () => {
      await verify().expect(200);

      const body = await errorOf(
        VERIFY,
        { usuarioId: registered.usuarioId, email: registered.usuario.email, codigo },
        400,
      );

      expect(body.message).toBe('Esta conta já foi verificada.');
    });

    it('rejects a code that does not match', async () => {
      const wrong = codigo === '000000' ? '999999' : '000000';

      const response = await verify({ codigo: wrong }).expect(400);

      expect((response.body as ErrorResponse).message).toBe(
        'Código de verificação inválido ou expirado.',
      );
      expect(await activeFlagOf(registered.usuarioId)).toBe(false);
    });

    it('rejects an expired code', async () => {
      await dataSource.query(
        `UPDATE email_verification_codes SET expires_at = NOW() - INTERVAL '1 minute'
          WHERE user_id = $1;`,
        [registered.usuarioId],
      );

      await verify().expect(400);
      expect(await activeFlagOf(registered.usuarioId)).toBe(false);
    });

    it('rejects an e-mail that does not belong to the user id', async () => {
      await verify({ email: 'carlos@uefs.br' }).expect(400);

      expect(await activeFlagOf(registered.usuarioId)).toBe(false);
    });

    it('rejects an unknown user id', async () => {
      await verify({ usuarioId: '00000000-0000-4000-8000-000000000000' }).expect(400);

      expect(await activeFlagOf(registered.usuarioId)).toBe(false);
    });

    it('rejects a user id that is not a uuid', async () => {
      const body = await errorOf(
        VERIFY,
        { usuarioId: 'nao-e-uuid', email: registered.usuario.email, codigo },
        400,
      );

      expect(body.message).toContain('Informe um identificador de usuário válido.');
    });

    it('rejects a code that is not six digits', async () => {
      const body = await errorOf(
        VERIFY,
        { usuarioId: registered.usuarioId, email: registered.usuario.email, codigo: '12a456' },
        400,
      );

      expect(body.message).toContain('O código deve conter exatamente 6 dígitos.');
    });
  });

  describe(`POST ${RESEND}`, () => {
    let registered: RegisterResponse;

    const resend = (email: string) => post(RESEND, { email });

    beforeEach(async () => {
      registered = await register(studentPayload());
      await ageCodesOf(registered.usuarioId, 120);
    });

    it('sends a fresh code and burns the previous one', async () => {
      const previous = await pendingCodeOf(registered.usuarioId);

      const response = await resend('ana@discente.uefs.br').expect(200);

      expect((response.body as { mensagem: string }).mensagem).toBe(CODE_RESENT);
      expect(await countPendingCodes(registered.usuarioId)).toBe(1);
      expect(await pendingCodeOf(registered.usuarioId)).not.toBe(previous);
    });

    it('refuses the code it just replaced', async () => {
      const previous = await pendingCodeOf(registered.usuarioId);

      await resend('ana@discente.uefs.br').expect(200);

      await post(VERIFY, {
        usuarioId: registered.usuarioId,
        email: 'ana@discente.uefs.br',
        codigo: previous,
      }).expect(400);
    });

    it('activates the account with the resent code', async () => {
      await resend('ana@discente.uefs.br').expect(200);

      await post(VERIFY, {
        usuarioId: registered.usuarioId,
        email: 'ana@discente.uefs.br',
        codigo: await pendingCodeOf(registered.usuarioId),
      }).expect(200);

      await post(LOGIN, { email: 'ana@discente.uefs.br', senha: 'senha-secreta' }).expect(200);
    });

    it('accepts the e-mail in any casing', async () => {
      const previous = await pendingCodeOf(registered.usuarioId);

      await resend('ANA@Discente.UEFS.br').expect(200);

      expect(await pendingCodeOf(registered.usuarioId)).not.toBe(previous);
    });

    it('stays inside the cooldown without sending a second code', async () => {
      await resend('ana@discente.uefs.br').expect(200);
      const fresh = await pendingCodeOf(registered.usuarioId);

      const response = await resend('ana@discente.uefs.br').expect(200);

      expect((response.body as { mensagem: string }).mensagem).toBe(CODE_RESENT);
      expect(await pendingCodeOf(registered.usuarioId)).toBe(fresh);
      expect(await countPendingCodes(registered.usuarioId)).toBe(1);
    });

    it('answers the same way for an e-mail nobody registered', async () => {
      const response = await resend('ninguem@uefs.br').expect(200);

      expect((response.body as { mensagem: string }).mensagem).toBe(CODE_RESENT);
    });

    it('answers the same way for an account already verified', async () => {
      await post(VERIFY, {
        usuarioId: registered.usuarioId,
        email: 'ana@discente.uefs.br',
        codigo: await pendingCodeOf(registered.usuarioId),
      }).expect(200);

      const response = await resend('ana@discente.uefs.br').expect(200);

      expect((response.body as { mensagem: string }).mensagem).toBe(CODE_RESENT);
      expect(await countPendingCodes(registered.usuarioId)).toBe(0);
    });

    it('rejects a payload that is not an e-mail', async () => {
      const body = await errorOf(RESEND, { email: 'nao-e-email' }, 400);

      expect(body.message).toContain('Informe um e-mail válido.');
    });

    it('rejects an unknown field', async () => {
      await errorOf(RESEND, { email: 'ana@discente.uefs.br', extra: 1 }, 400);
    });
  });

  describe(`POST ${RESET_REQUEST}`, () => {
    let registered: RegisterResponse;

    const requestReset = (email: string) => post(RESET_REQUEST, { email });

    beforeEach(async () => {
      registered = await registerAndActivate(studentPayload());
    });

    it('issues a reset code for a registered account', async () => {
      const response = await requestReset('ana@discente.uefs.br').expect(200);

      expect((response.body as { mensagem: string }).mensagem).toBe(PASSWORD_RESET_REQUESTED);
      expect(await countPendingResetCodes(registered.usuarioId)).toBe(1);
    });

    it('accepts the e-mail in any casing', async () => {
      await requestReset('ANA@Discente.UEFS.br').expect(200);

      expect(await countPendingResetCodes(registered.usuarioId)).toBe(1);
    });

    it('stays inside the cooldown without issuing a second code', async () => {
      await requestReset('ana@discente.uefs.br').expect(200);
      const fresh = await pendingResetCodeOf(registered.usuarioId);

      await requestReset('ana@discente.uefs.br').expect(200);

      expect(await pendingResetCodeOf(registered.usuarioId)).toBe(fresh);
      expect(await countPendingResetCodes(registered.usuarioId)).toBe(1);
    });

    it('issues a fresh code once the cooldown has elapsed', async () => {
      await requestReset('ana@discente.uefs.br').expect(200);
      const previous = await pendingResetCodeOf(registered.usuarioId);
      await ageResetCodesOf(registered.usuarioId, 120);

      await requestReset('ana@discente.uefs.br').expect(200);

      expect(await pendingResetCodeOf(registered.usuarioId)).not.toBe(previous);
      expect(await countPendingResetCodes(registered.usuarioId)).toBe(1);
    });

    it('answers the same way for an e-mail nobody registered', async () => {
      const response = await requestReset('ninguem@uefs.br').expect(200);

      expect((response.body as { mensagem: string }).mensagem).toBe(PASSWORD_RESET_REQUESTED);
    });

    it('rejects a payload that is not an e-mail', async () => {
      const body = await errorOf(RESET_REQUEST, { email: 'nao-e-email' }, 400);

      expect(body.message).toContain('Informe um e-mail válido.');
    });

    it('rejects an unknown field', async () => {
      await errorOf(RESET_REQUEST, { email: 'ana@discente.uefs.br', extra: 1 }, 400);
    });
  });

  describe(`POST ${RESET_VALIDATE}`, () => {
    let registered: RegisterResponse;

    const requestReset = (email: string) => post(RESET_REQUEST, { email });
    const validateCode = (email: string, codigo: string) => post(RESET_VALIDATE, { email, codigo });

    beforeEach(async () => {
      registered = await registerAndActivate(studentPayload());
      await requestReset('ana@discente.uefs.br').expect(200);
    });

    it('issues a reset token for a valid code', async () => {
      const code = await pendingResetCodeOf(registered.usuarioId);

      const response = await validateCode('ana@discente.uefs.br', code).expect(200);

      expect((response.body as { token: string }).token).toEqual(expect.any(String));
    });

    it('refuses the code it just consumed', async () => {
      const code = await pendingResetCodeOf(registered.usuarioId);
      await validateCode('ana@discente.uefs.br', code).expect(200);

      await validateCode('ana@discente.uefs.br', code).expect(400);
    });

    it('rejects a wrong code', async () => {
      await validateCode('ana@discente.uefs.br', '000000').expect(400);
    });

    it('rejects an expired code', async () => {
      const code = await pendingResetCodeOf(registered.usuarioId);
      await expireResetCodesOf(registered.usuarioId);

      await validateCode('ana@discente.uefs.br', code).expect(400);
    });

    it('rejects an e-mail nobody registered', async () => {
      await validateCode('ninguem@uefs.br', '123456').expect(400);
    });

    it('rejects a code that is not 6 digits', async () => {
      await errorOf(RESET_VALIDATE, { email: 'ana@discente.uefs.br', codigo: '12' }, 400);
    });
  });

  describe(`POST ${RESET_PASSWORD}`, () => {
    const requestReset = (email: string) => post(RESET_REQUEST, { email });
    const validateCode = (email: string, codigo: string) => post(RESET_VALIDATE, { email, codigo });
    const resetPassword = (token: string, novaSenha: string) =>
      post(RESET_PASSWORD, { token, novaSenha });

    const issueResetToken = async (): Promise<{ registered: RegisterResponse; token: string }> => {
      const registered = await registerAndActivate(studentPayload());
      await requestReset('ana@discente.uefs.br').expect(200);
      const code = await pendingResetCodeOf(registered.usuarioId);
      const response = await validateCode('ana@discente.uefs.br', code).expect(200);

      return { registered, token: (response.body as { token: string }).token };
    };

    it('changes the password so the new one logs in and the old one no longer works', async () => {
      const { token } = await issueResetToken();

      await resetPassword(token, 'nova-senha-123').expect(200);

      await post(LOGIN, { email: 'ana@discente.uefs.br', senha: 'nova-senha-123' }).expect(200);
      await post(LOGIN, { email: 'ana@discente.uefs.br', senha: 'senha-secreta' }).expect(401);
    });

    it('rejects a garbage token', async () => {
      await resetPassword('not-a-jwt', 'nova-senha-123').expect(400);
    });

    it('rejects a password shorter than 8 characters', async () => {
      const { token } = await issueResetToken();

      await errorOf(RESET_PASSWORD, { token, novaSenha: '123' }, 400);
    });
  });
});
