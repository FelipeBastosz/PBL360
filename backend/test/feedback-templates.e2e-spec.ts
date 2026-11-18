import type { Server } from 'node:http';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { UserType } from '@/users/domain/enums/user-type.enum';
import { CreateFeedbackTemplates1793000000000 } from '@/migrations/1793000000000-CreateFeedbackTemplates';
import { createTestApp } from './helpers/create-test-app';
import {
  api,
  cleanDatabase,
  insertDefaultPerformanceTable,
  insertUser,
  type TestUser,
} from './helpers/fixtures';

interface FeedbackTemplateItem {
  id: string;
  titulo: string;
  texto: string;
}

interface OpenApiDocument {
  paths: Record<
    string,
    Record<
      string,
      {
        tags?: string[];
        summary?: string;
        security?: Array<Record<string, string[]>>;
        responses: Record<string, unknown>;
      }
    >
  >;
  components: {
    schemas: Record<string, { properties: Record<string, unknown> }>;
  };
}

describe('Feedback Templates (e2e)', () => {
  let app: INestApplication;
  let database: DataSource;
  let tutor: TestUser;
  let student: TestUser;

  beforeAll(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
    database = testApp.moduleRef.get(DataSource);
  });

  afterAll(async () => {
    if (database) await cleanDatabase(database);
    if (app) await app.close();
  });

  beforeEach(async () => {
    await cleanDatabase(database);
    tutor = await insertUser(app, database, 'tutor@uefs.br', UserType.TUTOR);
    student = await insertUser(app, database, 'aluno@discente.uefs.br', UserType.STUDENT);
  });

  describe('GET /modelos-feedback', () => {
    it('returns the pre-registered feedback templates catalog for tutors (200 OK)', async () => {
      const response = await api(app, tutor).get('/modelos-feedback').expect(200);
      const templates = response.body as FeedbackTemplateItem[];

      expect(templates).toHaveLength(5);
      expect(templates).toEqual([
        {
          id: '4f700000-0000-4000-8000-000000000001',
          titulo: 'Boa participação e engajamento',
          texto: expect.any(String) as string,
        },
        {
          id: '4f700000-0000-4000-8000-000000000002',
          titulo: 'Necessidade de aprofundar argumentos',
          texto: expect.any(String) as string,
        },
        {
          id: '4f700000-0000-4000-8000-000000000003',
          titulo: 'Preparação para a próxima sessão',
          texto: expect.any(String) as string,
        },
        {
          id: '4f700000-0000-4000-8000-000000000004',
          titulo: 'Colaboração e escuta ativa',
          texto: expect.any(String) as string,
        },
        {
          id: '4f700000-0000-4000-8000-000000000005',
          titulo: 'Pontualidade e postura proativa',
          texto: expect.any(String) as string,
        },
      ]);

      for (const item of templates) {
        expect(Object.keys(item)).toEqual(['id', 'titulo', 'texto']);
        expect(item.titulo.length).toBeGreaterThan(0);
        expect(item.titulo.length).toBeLessThanOrEqual(120);
        expect(item.texto.length).toBeGreaterThan(0);
        expect(item.texto.length).toBeLessThanOrEqual(2000);
      }
    });

    it('rejects authenticated students with 403 Forbidden', async () => {
      await api(app, student).get('/modelos-feedback').expect(403);
    });

    it('rejects unauthenticated requests with 401 Unauthorized', async () => {
      await api(app).get('/modelos-feedback').expect(401);
    });

    it('is idempotent when the initial migration is executed multiple times', async () => {
      const migration = new CreateFeedbackTemplates1793000000000();
      const queryRunner = database.createQueryRunner();
      try {
        await migration.up(queryRunner);
      } finally {
        await queryRunner.release();
      }

      const response = await api(app, tutor).get('/modelos-feedback').expect(200);
      expect(response.body).toHaveLength(5);
    });

    it('keeps session feedbacks completely decoupled from template catalog changes', async () => {
      const catalogRes = await api(app, tutor).get('/modelos-feedback').expect(200);
      const [firstTemplate] = catalogRes.body as FeedbackTemplateItem[];

      const [room] = await database.query<[{ id: string }]>(
        `INSERT INTO rooms (tutor_id, name, course_code, room_code, semester, active)
         VALUES ($1, 'Engenharia de Software', 'EXA613', 'ROOM9001', '2026.2', true)
         RETURNING id;`,
        [tutor.id],
      );
      await insertDefaultPerformanceTable(database, tutor.id);
      await database.query(`INSERT INTO room_students (room_id, student_id) VALUES ($1, $2);`, [
        room.id,
        student.id,
      ]);

      const [problem] = await database.query<[{ id: string }]>(
        `INSERT INTO problems (room_id, title, description, order_index, created_by)
         VALUES ($1, 'Problema 1', 'Descrição', 1, $2)
         RETURNING id;`,
        [room.id, tutor.id],
      );
      const [session] = await database.query<[{ id: string }]>(
        `INSERT INTO sessions (problem_id, title, description, date, order_index, status)
         VALUES ($1, 'Sessão 1', 'Abertura', '2026-10-15', 1, 'agendada')
         RETURNING id;`,
        [problem.id],
      );

      const adaptedText = `${firstTemplate!.texto} Destaque especial na síntese final.`;

      await api(app, tutor)
        .put(`/sessoes/${session.id}/alunos/${student.id}/feedback`, { texto: adaptedText })
        .expect(200);

      const originalText = firstTemplate!.texto;
      await database.query(`UPDATE feedback_templates SET text = $1 WHERE id = $2;`, [
        'Texto do catálogo alterado posteriormente.',
        firstTemplate!.id,
      ]);

      try {
        const savedFeedback = await api(app, tutor)
          .get(`/sessoes/${session.id}/alunos/${student.id}/feedback`)
          .expect(200);

        expect(savedFeedback.body).toMatchObject({
          sessaoId: session.id,
          destinatarioId: student.id,
          texto: adaptedText,
        });
      } finally {
        await database.query(`UPDATE feedback_templates SET text = $1 WHERE id = $2;`, [
          originalText,
          firstTemplate!.id,
        ]);
      }
    });

    it('documents GET /api/modelos-feedback in Swagger with 200, 401 and 403', async () => {
      const response = await request(app.getHttpServer() as Server)
        .get('/api/docs/json')
        .expect(200);
      const document = response.body as OpenApiDocument;

      const operation = document.paths['/api/modelos-feedback']?.get;
      expect(operation).toBeDefined();
      expect(operation?.tags).toEqual(['Feedbacks']);
      expect(operation?.security).toEqual(expect.arrayContaining([{ jwt: [] }]));
      expect(Object.keys(operation?.responses ?? {})).toEqual(
        expect.arrayContaining(['200', '401', '403']),
      );

      const schema = document.components.schemas.FeedbackTemplateResponseDto;
      expect(schema).toBeDefined();
      expect(Object.keys(schema?.properties ?? {})).toEqual(['id', 'titulo', 'texto']);
    });
  });
});
