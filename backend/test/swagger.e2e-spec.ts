import { ValidationPipe, type INestApplication } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '@/app.module';
import { setupSwagger } from '@/config/swagger.config';

interface OpenApiDocument {
  info: { title: string; version: string };
  paths: Record<string, Record<string, { tags?: string[]; responses: Record<string, unknown> }>>;
  components: { schemas: Record<string, { properties: Record<string, unknown> }> };
}

describe('Swagger (e2e)', () => {
  let moduleRef: TestingModule;
  let app: INestApplication;
  let document: OpenApiDocument;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    setupSwagger(app, 'api/docs');
    await app.init();

    const response = await request(app.getHttpServer()).get('/api/docs/json').expect(200);
    document = response.body as OpenApiDocument;
  });

  afterAll(async () => {
    await app.close();
  });

  it('serves the documentation page', () => {
    return request(app.getHttpServer()).get('/api/docs').expect(200);
  });

  it('describes both authentication endpoints', () => {
    expect(Object.keys(document.paths)).toEqual(
      expect.arrayContaining(['/api/autenticacao/registro', '/api/autenticacao/login']),
    );
  });

  it('groups the authentication endpoints under one tag', () => {
    expect(document.paths['/api/autenticacao/login'].post.tags).toEqual(['Autenticação']);
  });

  it('documents the status codes each endpoint answers with', () => {
    expect(Object.keys(document.paths['/api/autenticacao/registro'].post.responses)).toEqual(
      expect.arrayContaining(['201', '400', '409']),
    );
    expect(Object.keys(document.paths['/api/autenticacao/login'].post.responses)).toEqual(
      expect.arrayContaining(['200', '400', '401']),
    );
  });

  it('publishes the request payload in Portuguese', () => {
    expect(Object.keys(document.components.schemas.RegisterUserDto.properties)).toEqual([
      'nome',
      'email',
      'senha',
      'tipo',
      'matricula',
      'fotoUrl',
    ]);
  });

  it('publishes the response payload without the password hash', () => {
    const { properties } = document.components.schemas.UserResponseDto;

    expect(Object.keys(properties)).toEqual([
      'id',
      'nome',
      'email',
      'tipo',
      'matricula',
      'fotoUrl',
      'ativo',
      'criadoEm',
    ]);
  });
});
