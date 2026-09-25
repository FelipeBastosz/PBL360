import type { Server } from 'node:http';
import { Logger, type INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from './helpers/create-test-app';

describe('HTTP logger (e2e)', () => {
  let app: INestApplication;
  let warn: jest.SpyInstance;

  beforeAll(async () => {
    ({ app } = await createTestApp());
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    warn = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
  });

  afterEach(() => {
    warn.mockRestore();
  });

  it('logs a request that matches no route', async () => {
    await request(app.getHttpServer() as Server)
      .get('/api/rota-inexistente')
      .expect(404);

    expect(warn).toHaveBeenCalledWith(expect.stringContaining('GET /api/rota-inexistente 404 - '));
  });
});
