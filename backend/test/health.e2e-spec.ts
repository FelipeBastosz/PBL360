import type { Server } from 'node:http';
import { type INestApplication } from '@nestjs/common';
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

  beforeAll(async () => {
    ({ app, moduleRef } = await createTestApp());
    dataSource = moduleRef.get(DataSource);
  });

  afterAll(async () => {
    await app.close();
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

    querySpy.mockRestore();
  });
});
