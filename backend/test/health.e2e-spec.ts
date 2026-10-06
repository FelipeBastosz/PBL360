import type { Server } from 'node:http';
import { Logger, type INestApplication } from '@nestjs/common';
import { type TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { createTestApp } from './helpers/create-test-app';

interface HealthCheckResponseBody {
  status: string;
  banco: string;
  versao: string;
}

describe('Health Check (e2e)', () => {
  let app: INestApplication;
  let moduleRef: TestingModule;
  let dataSource: DataSource;
  let errorLog: jest.SpyInstance;

  beforeAll(async () => {
    ({ app, moduleRef } = await createTestApp());
    dataSource = moduleRef.get(DataSource);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    errorLog = jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    errorLog.mockRestore();
  });

  it('responds with 200 ok on /saude without authentication', async () => {
    const res = await request(app.getHttpServer() as Server)
      .get('/saude')
      .expect(200);

    const body = res.body as HealthCheckResponseBody;
    expect(body).toMatchObject({
      status: 'ok',
      banco: 'ok',
    });
    expect(typeof body.versao).toBe('string');
  });

  it('responds with 200 ok on /api/saude without authentication', async () => {
    const res = await request(app.getHttpServer() as Server)
      .get('/api/saude')
      .expect(200);

    const body = res.body as HealthCheckResponseBody;
    expect(body).toMatchObject({
      status: 'ok',
      banco: 'ok',
    });
    expect(typeof body.versao).toBe('string');
  });

  it('returns 503 service unavailable when database fails', async () => {
    const querySpy = jest.spyOn(dataSource, 'query').mockRejectedValueOnce(new Error('DB offline'));

    const res = await request(app.getHttpServer() as Server)
      .get('/api/saude')
      .expect(503);

    const body = res.body as HealthCheckResponseBody;
    expect(body).toMatchObject({
      status: 'erro',
      banco: 'indisponivel',
    });
    expect(typeof body.versao).toBe('string');
    expect(errorLog).toHaveBeenCalledWith(expect.stringContaining('GET /api/saude 503'));

    querySpy.mockRestore();
  });
});
