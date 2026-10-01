import type { Server } from 'node:http';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from './helpers/create-test-app';

interface OpenApiDocument {
  info: { title: string; version: string };
  paths: Record<string, Record<string, { tags?: string[]; responses: Record<string, unknown> }>>;
  components: { schemas: Record<string, { properties: Record<string, unknown> }> };
}

describe('Swagger (e2e)', () => {
  let app: INestApplication;
  let document: OpenApiDocument;

  beforeAll(async () => {
    ({ app } = await createTestApp());

    const response = await request(app.getHttpServer() as Server)
      .get('/api/docs/json')
      .expect(200);
    document = response.body as OpenApiDocument;
  });

  afterAll(async () => {
    await app.close();
  });

  it('serves the documentation page', () => {
    return request(app.getHttpServer() as Server)
      .get('/api/docs')
      .expect(200);
  });

  it('describes both authentication endpoints', () => {
    expect(Object.keys(document.paths)).toEqual(
      expect.arrayContaining(['/api/autenticacao/registro', '/api/autenticacao/login']),
    );
  });

  it('groups the authentication endpoints under one tag', () => {
    expect(document.paths['/api/autenticacao/login']!.post!.tags).toEqual(['Autenticação']);
  });

  it('documents the status codes each endpoint answers with', () => {
    expect(Object.keys(document.paths['/api/autenticacao/registro']!.post!.responses)).toEqual(
      expect.arrayContaining(['201', '400', '409']),
    );
    expect(Object.keys(document.paths['/api/autenticacao/login']!.post!.responses)).toEqual(
      expect.arrayContaining(['200', '400', '401']),
    );
  });

  it('publishes the request payload in Portuguese', () => {
    expect(Object.keys(document.components.schemas.RegisterUserFormDto!.properties)).toEqual([
      'nome',
      'email',
      'senha',
      'tipo',
      'matricula',
      'foto',
    ]);
  });

  it('documents the photo upload of the registration form', () => {
    const registration = document.paths['/api/autenticacao/registro']!.post! as unknown as {
      requestBody: { content: Record<string, unknown> };
    };

    expect(Object.keys(registration.requestBody.content)).toEqual(
      expect.arrayContaining(['multipart/form-data', 'application/json']),
    );
  });

  it('publishes the response payload without the password hash', () => {
    const { properties } = document.components.schemas.UserResponseDto!;

    expect(Object.keys(properties)).toEqual([
      'id',
      'nome',
      'email',
      'tipo',
      'matricula',
      'possuiFoto',
      'ativo',
      'criadoEm',
    ]);
  });

  it('documents sessions endpoints under the Sessões tag', () => {
    const sessionPaths = [
      '/api/salas/{roomId}/problemas/{problemId}/sessoes',
      '/api/salas/{roomId}/problemas/{problemId}/sessoes/{sessionId}',
      '/api/salas/{roomId}/problemas/{problemId}/sessoes/{sessionId}/impacto-exclusao',
    ];

    expect(Object.keys(document.paths)).toEqual(expect.arrayContaining(sessionPaths));

    expect(document.paths['/api/salas/{roomId}/problemas/{problemId}/sessoes']!.post!.tags).toEqual(
      ['Sessões'],
    );
    expect(document.paths['/api/salas/{roomId}/problemas/{problemId}/sessoes']!.get!.tags).toEqual([
      'Sessões',
    ]);
  });
});
