import type { INestApplication } from '@nestjs/common';
import type { Server } from 'node:http';
import request from 'supertest';
import { EMAIL_VERIFICATION_SENDER } from '@/auth/domain/services/email-verification-sender';
import { createTestApp } from './helpers/create-test-app';

jest.setTimeout(30000);

const LOGIN = '/api/autenticacao/login';
const RESET_REQUEST = '/api/autenticacao/recuperacao-senha';

describe('Throttling (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    ({ app } = await createTestApp((builder) =>
      builder
        .overrideProvider(EMAIL_VERIFICATION_SENDER)
        .useValue({ sendCode: jest.fn().mockResolvedValue(undefined) }),
    ));
  });

  afterAll(async () => {
    await app.close();
  });

  const post = (path: string, body: object) =>
    request(app.getHttpServer() as Server)
      .post(path)
      .send(body);

  it('limits login attempts per address and e-mail', async () => {
    const attempt = () => post(LOGIN, { email: 'alvo@uefs.br', senha: 'tentativa-errada' });

    for (let i = 0; i < 10; i++) {
      await attempt().expect(401);
    }

    await attempt().expect(429);
    await post(LOGIN, { email: 'outra@uefs.br', senha: 'tentativa-errada' }).expect(401);
  });

  it('applies the stricter limit to password recovery', async () => {
    const ask = () => post(RESET_REQUEST, { email: 'recupera@uefs.br' });

    for (let i = 0; i < 5; i++) {
      await ask().expect(200);
    }

    await ask().expect(429);
  });
});
