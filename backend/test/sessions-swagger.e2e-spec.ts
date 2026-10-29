import type { Server } from 'node:http';
import { type INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from './helpers/create-test-app';

interface OpenApiOperation {
  summary?: string;
  tags?: string[];
  security?: Array<Record<string, string[]>>;
  parameters?: Array<{
    name: string;
    in: string;
    required?: boolean;
    schema?: { type?: string; format?: string };
  }>;
  requestBody?: {
    required?: boolean;
    content: Record<string, { schema: { $ref?: string } }>;
  };
  responses: Record<
    string,
    { description?: string; content?: Record<string, { schema: unknown }> }
  >;
}

interface OpenApiSchema {
  type?: string;
  properties?: Record<
    string,
    { type?: string; format?: string; example?: unknown; nullable?: boolean }
  >;
  required?: string[];
}

interface OpenApiDocument {
  openapi: string;
  info: { title: string; version: string; description?: string };
  paths: Record<string, Record<string, OpenApiOperation>>;
  components: {
    schemas: Record<string, OpenApiSchema>;
    securitySchemes?: Record<string, { type: string; scheme?: string; bearerFormat?: string }>;
  };
}

describe('Sessions Swagger Documentation (e2e)', () => {
  let app: INestApplication;
  let document: OpenApiDocument;

  const basePath = '/api/salas/{roomId}/problemas/{problemId}/sessoes';
  const itemPath = '/api/salas/{roomId}/problemas/{problemId}/sessoes/{sessionId}';
  const impactPath =
    '/api/salas/{roomId}/problemas/{problemId}/sessoes/{sessionId}/impacto-exclusao';

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

  describe('Swagger UI and OpenAPI Specification Availability', () => {
    it('serves the interactive Swagger UI documentation at /api/docs', async () => {
      const response = await request(app.getHttpServer() as Server)
        .get('/api/docs')
        .expect(200);

      expect(response.type).toBe('text/html');
      expect(response.text).toContain('Swagger UI');
    });

    it('publishes the OpenAPI 3.0 document with PBL360 API info and version', () => {
      expect(document.openapi).toMatch(/^3\./);
      expect(document.info.title).toBe('PBL360 API');
      expect(document.info.version).toBe('0.1.0');
    });

    it('configures JWT HTTP Bearer security scheme for protected endpoints', () => {
      expect(document.components.securitySchemes).toBeDefined();
      expect(document.components.securitySchemes?.jwt).toMatchObject({
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      });
    });
  });

  describe('Endpoints Discovery and Tag Grouping', () => {
    it('documents all 6 session routes in the OpenAPI specification', () => {
      const paths = Object.keys(document.paths);
      expect(paths).toContain(basePath);
      expect(paths).toContain(itemPath);
      expect(paths).toContain(impactPath);
    });

    it('groups all session operations under the "Sessões" tag', () => {
      const postOp = document.paths[basePath]?.post;
      const listOp = document.paths[basePath]?.get;
      const getOp = document.paths[itemPath]?.get;
      const putOp = document.paths[itemPath]?.put;
      const impactOp = document.paths[impactPath]?.get;
      const deleteOp = document.paths[itemPath]?.delete;

      expect(postOp?.tags).toEqual(['Sessões']);
      expect(listOp?.tags).toEqual(['Sessões']);
      expect(getOp?.tags).toEqual(['Sessões']);
      expect(putOp?.tags).toEqual(['Sessões']);
      expect(impactOp?.tags).toEqual(['Sessões']);
      expect(deleteOp?.tags).toEqual(['Sessões']);
    });
  });

  describe('Operations Summaries and Descriptions', () => {
    it('documents clear and accurate operation summaries for each endpoint', () => {
      expect(document.paths[basePath]?.post?.summary).toBe('Cria uma sessão no problema');
      expect(document.paths[basePath]?.get?.summary).toBe(
        'Lista as sessões do problema por data e ordem',
      );
      expect(document.paths[itemPath]?.get?.summary).toBe('Obtém os detalhes de uma sessão');
      expect(document.paths[itemPath]?.put?.summary).toBe('Atualiza uma sessão');
      expect(document.paths[impactPath]?.get?.summary).toBe(
        'Consulta o impacto da exclusão de uma sessão',
      );
      expect(document.paths[itemPath]?.delete?.summary).toBe(
        'Exclui uma sessão sem registros vinculados',
      );
    });
  });

  describe('Security Requirements', () => {
    it('declares JWT bearer authentication on all session endpoints', () => {
      const operations: OpenApiOperation[] = [
        document.paths[basePath]!.post!,
        document.paths[basePath]!.get!,
        document.paths[itemPath]!.get!,
        document.paths[itemPath]!.put!,
        document.paths[impactPath]!.get!,
        document.paths[itemPath]!.delete!,
      ];

      for (const op of operations) {
        expect(op.security).toEqual(expect.arrayContaining([{ jwt: [] }]));
      }
    });
  });

  describe('Path Parameters Specification', () => {
    it('documents roomId and problemId parameters as UUID path variables', () => {
      const parameters = document.paths[basePath]!.post!.parameters ?? [];
      const paramNames = parameters.map((p) => p.name);

      expect(paramNames).toContain('roomId');
      expect(paramNames).toContain('problemId');

      for (const param of parameters) {
        expect(param.in).toBe('path');
        expect(param.required).toBe(true);
      }
    });

    it('documents sessionId parameter for item and impact endpoints', () => {
      const itemParams = document.paths[itemPath]!.get!.parameters ?? [];
      const itemParamNames = itemParams.map((p) => p.name);
      expect(itemParamNames).toContain('sessionId');

      const impactParams = document.paths[impactPath]!.get!.parameters ?? [];
      const impactParamNames = impactParams.map((p) => p.name);
      expect(impactParamNames).toContain('sessionId');
    });
  });

  describe('Response Status Codes and Error Documentation', () => {
    it('documents POST responses: 201, 400, 401, 403, 404', () => {
      const responses = Object.keys(document.paths[basePath]!.post!.responses);
      expect(responses).toEqual(expect.arrayContaining(['201', '400', '401', '403', '404']));
      expect(document.paths[basePath]!.post!.responses['201']?.description).toBe(
        'Sessão criada com sucesso.',
      );
    });

    it('documents GET list responses: 200, 401, 403, 404', () => {
      const responses = Object.keys(document.paths[basePath]!.get!.responses);
      expect(responses).toEqual(expect.arrayContaining(['200', '401', '403', '404']));
      expect(document.paths[basePath]!.get!.responses['200']?.description).toBe(
        'Sessões listadas com sucesso.',
      );
    });

    it('documents GET detail responses: 200, 401, 403, 404', () => {
      const responses = Object.keys(document.paths[itemPath]!.get!.responses);
      expect(responses).toEqual(expect.arrayContaining(['200', '401', '403', '404']));
      expect(document.paths[itemPath]!.get!.responses['200']?.description).toBe(
        'Sessão encontrada.',
      );
    });

    it('documents PUT update responses: 200, 400, 401, 403, 404', () => {
      const responses = Object.keys(document.paths[itemPath]!.put!.responses);
      expect(responses).toEqual(expect.arrayContaining(['200', '400', '401', '403', '404']));
      expect(document.paths[itemPath]!.put!.responses['200']?.description).toBe(
        'Sessão atualizada.',
      );
    });

    it('documents GET impacto-exclusao responses: 200, 401, 403, 404', () => {
      const responses = Object.keys(document.paths[impactPath]!.get!.responses);
      expect(responses).toEqual(expect.arrayContaining(['200', '401', '403', '404']));
      expect(document.paths[impactPath]!.get!.responses['200']?.description).toBe(
        'Impacto consultado.',
      );
    });

    it('documents DELETE responses: 204, 401, 403, 404, 409', () => {
      const responses = Object.keys(document.paths[itemPath]!.delete!.responses);
      expect(responses).toEqual(expect.arrayContaining(['204', '401', '403', '404', '409']));
      expect(document.paths[itemPath]!.delete!.responses['204']?.description).toBe(
        'Sessão excluída.',
      );
      expect(document.paths[itemPath]!.delete!.responses['409']?.description).toBe(
        'A sessão possui registros vinculados.',
      );
    });
  });

  describe('Component Schemas and DTO Definitions', () => {
    it('publishes CreateSessionDto schema with Portuguese property names and examples', () => {
      const schema = document.components.schemas.CreateSessionDto;
      expect(schema).toBeDefined();
      expect(Object.keys(schema?.properties ?? {})).toEqual(['titulo', 'descricao', 'data']);
      expect(schema?.properties?.data?.pattern).toBe('^\\d{2}-\\d{2}-\\d{4}$');
      expect(schema?.properties?.descricao?.nullable).toBe(true);
    });

    it('publishes UpdateSessionDto schema', () => {
      const schema = document.components.schemas.UpdateSessionDto;
      expect(schema).toBeDefined();
      expect(Object.keys(schema?.properties ?? {})).toEqual(['titulo', 'descricao', 'data']);
      expect(schema?.properties?.data?.pattern).toBe('^\\d{2}-\\d{2}-\\d{4}$');
    });

    it('publishes SessionListResponseDto with expected fields', () => {
      const schema = document.components.schemas.SessionListResponseDto;
      expect(schema).toBeDefined();
      expect(Object.keys(schema?.properties ?? {})).toEqual([
        'id',
        'titulo',
        'descricao',
        'data',
        'ordem',
        'status',
      ]);
    });

    it('publishes SessionDetailResponseDto containing problemaId and salaId', () => {
      const schema = document.components.schemas.SessionDetailResponseDto;
      expect(schema).toBeDefined();
      const properties = Object.keys(schema?.properties ?? {});
      expect(properties).toContain('problemaId');
      expect(properties).toContain('salaId');
    });

    it('publishes SessionDeletionImpactDto schema with podeExcluir and record counts', () => {
      const schema = document.components.schemas.SessionDeletionImpactDto;
      expect(schema).toBeDefined();
      expect(Object.keys(schema?.properties ?? {})).toEqual([
        'podeExcluir',
        'chamada',
        'papeis',
        'observacoes',
        'avaliacoes',
        'feedbacks',
      ]);
    });
  });

  describe('Session Roles Swagger Documentation', () => {
    const rolesBasePath = '/api/sessoes/{sessionId}/papeis';
    const rolesStudentPath = '/api/sessoes/{sessionId}/papeis/{studentId}';

    it('documents session roles endpoints under the "Papéis da sessão" tag', () => {
      const paths = Object.keys(document.paths);
      expect(paths).toContain(rolesBasePath);
      expect(paths).toContain(rolesStudentPath);

      expect(document.paths[rolesBasePath]?.get?.tags).toEqual(['Papéis da sessão']);
      expect(document.paths[rolesStudentPath]?.put?.tags).toEqual(['Papéis da sessão']);
    });

    it('documents operation summaries for session roles', () => {
      expect(document.paths[rolesBasePath]?.get?.summary).toBe(
        'Lista os papéis atribuídos na sessão',
      );
      expect(document.paths[rolesStudentPath]?.put?.summary).toBe(
        'Atribui, troca ou remove o papel de um aluno',
      );
    });

    it('documents security requirements for session roles endpoints', () => {
      expect(document.paths[rolesBasePath]?.get?.security).toEqual(
        expect.arrayContaining([{ jwt: [] }]),
      );
      expect(document.paths[rolesStudentPath]?.put?.security).toEqual(
        expect.arrayContaining([{ jwt: [] }]),
      );
    });

    it('documents response codes for listing and assigning session roles', () => {
      const listResponses = Object.keys(document.paths[rolesBasePath]!.get!.responses);
      expect(listResponses).toEqual(expect.arrayContaining(['200', '401', '403', '404']));

      const putResponses = Object.keys(document.paths[rolesStudentPath]!.put!.responses);
      expect(putResponses).toEqual(
        expect.arrayContaining(['200', '400', '401', '403', '404', '409', '422']),
      );
    });

    it('publishes UpdateSessionRoleDto, SessionRoleResponseDto and AssignedSessionRoleResponseDto schemas', () => {
      const updateSchema = document.components.schemas.UpdateSessionRoleDto;
      expect(updateSchema).toBeDefined();
      expect(Object.keys(updateSchema?.properties ?? {})).toEqual([
        'papel',
        'notaPapel',
        'transferir',
      ]);

      const roleResponseSchema = document.components.schemas.SessionRoleResponseDto;
      expect(roleResponseSchema).toBeDefined();
      expect(Object.keys(roleResponseSchema?.properties ?? {})).toEqual([
        'alunoId',
        'nome',
        'papel',
        'notaPapel',
      ]);

      const assignedRoleSchema = document.components.schemas.AssignedSessionRoleResponseDto;
      expect(assignedRoleSchema).toBeDefined();
      expect(Object.keys(assignedRoleSchema?.properties ?? {})).toEqual([
        'alunoId',
        'papel',
        'notaPapel',
      ]);
    });
  });

  describe('Session report export Swagger', () => {
    const exportPath = '/api/sessoes/{sessaoId}/relatorio/exportacao';

    it('documents the export endpoint with summary and tags', () => {
      const operation = document.paths[exportPath]?.get;
      expect(operation).toBeDefined();
      expect(operation?.tags).toContain('Sessões');
      expect(operation?.summary).toBe('Exporta o relatório da sessão em PDF ou Excel');
    });

    it('documents security requirements for export endpoint', () => {
      expect(document.paths[exportPath]?.get?.security).toEqual(
        expect.arrayContaining([{ jwt: [] }]),
      );
    });

    it('documents query parameter formato and response codes 200, 400, 401, 403, 404, 500', () => {
      const operation = document.paths[exportPath]?.get;
      const responses = Object.keys(operation?.responses ?? {});
      expect(responses).toEqual(expect.arrayContaining(['200', '400', '401', '403', '404', '500']));

      const okResponse = operation?.responses['200'];
      expect(Object.keys(okResponse?.content ?? {})).toEqual(
        expect.arrayContaining([
          'application/pdf',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]),
      );

      const formatParam = operation?.parameters?.find((p) => p.name === 'formato');
      expect(formatParam).toBeDefined();
      expect(formatParam?.in).toBe('query');
    });
  });
});
