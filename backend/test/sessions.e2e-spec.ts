import type { Server } from 'node:http';
import { type INestApplication } from '@nestjs/common';
import { type TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { DataSource } from 'typeorm';

import { UserType } from '@/users/domain/enums/user-type.enum';
import { createTestApp } from './helpers/create-test-app';
import { cleanDatabase, insertDefaultPerformanceTable, signAccessToken } from './helpers/fixtures';

interface SessionCreatedResponseBody {
  id: string;
  problemaId: string;
  titulo: string;
  descricao: string | null;
  data: string;
  ordem: number;
  status: string;
}

interface SessionDetailResponseBody {
  id: string;
  problemaId: string;
  salaId: string;
  titulo: string;
  descricao: string | null;
  data: string;
  ordem: number;
  status: string;
}

interface SessionResponseBody {
  id: string;
  titulo: string;
  descricao: string | null;
  data: string;
  ordem: number;
  status: string;
}

interface SessionDeletionImpactResponseBody {
  podeExcluir: boolean;
  chamada: number;
  papeis: number;
  observacoes: number;
  avaliacoes: number;
  feedbacks: number;
}

interface ProblemDeletionImpactResponseBody {
  sessoes: number;
  notas: number;
  feedbacks: number;
  avaliacoes: number;
}

interface ErrorResponseBody {
  statusCode: number;
  message: string | string[];
  error: string;
}

describe('Sessions (e2e)', () => {
  let moduleRef: TestingModule;
  let app: INestApplication;
  let dataSource: DataSource;

  let ownerTutorId: string;
  let coTutorId: string;
  let otherTutorId: string;
  let studentId: string;

  let ownerToken: string;
  let coTutorToken: string;
  let otherTutorToken: string;
  let studentToken: string;

  let roomId: string;
  let otherRoomId: string;
  let problemId: string;
  let otherProblemId: string;

  const validSessionPayload = {
    titulo: 'Sessão 1 - Abertura do Problema',
    descricao: 'Apresentação do cenário e definição dos objetivos de aprendizagem.',
    data: '15-10-2026',
  };

  const server = () => request(app.getHttpServer() as Server);

  beforeAll(async () => {
    ({ app, moduleRef } = await createTestApp());
    dataSource = moduleRef.get(DataSource);
  });

  afterAll(async () => {
    await cleanDatabase(dataSource);
    await app.close();
  });

  beforeEach(async () => {
    await cleanDatabase(dataSource);

    const [owner] = await dataSource.query<[{ id: string }]>(
      `INSERT INTO users (name, email, password_hash, type, active)
       VALUES ('Carlos Professor', 'carlos@uefs.br', 'hash', '${UserType.TUTOR}', true)
       RETURNING id;`,
    );
    ownerTutorId = owner.id;

    const [coTutor] = await dataSource.query<[{ id: string }]>(
      `INSERT INTO users (name, email, password_hash, type, active)
       VALUES ('Maria Co-tutora', 'maria@uefs.br', 'hash', '${UserType.TUTOR}', true)
       RETURNING id;`,
    );
    coTutorId = coTutor.id;

    const [otherTutor] = await dataSource.query<[{ id: string }]>(
      `INSERT INTO users (name, email, password_hash, type, active)
       VALUES ('Ana Outra Tutora', 'ana@uefs.br', 'hash', '${UserType.TUTOR}', true)
       RETURNING id;`,
    );
    otherTutorId = otherTutor.id;

    const [student] = await dataSource.query<[{ id: string }]>(
      `INSERT INTO users (name, email, password_hash, type, registration_number, active)
       VALUES ('João Discente', 'joao@discente.uefs.br', 'hash', '${UserType.STUDENT}', '20260001', true)
       RETURNING id;`,
    );
    studentId = student.id;

    const [room] = await dataSource.query<[{ id: string }]>(
      `INSERT INTO rooms (tutor_id, name, course_code, room_code, semester, active)
       VALUES ($1, 'Engenharia de Software', 'EXA123', 'ROOM1234', '2026.2', true)
       RETURNING id;`,
      [ownerTutorId],
    );
    roomId = room.id;

    await dataSource.query(`INSERT INTO room_tutors (room_id, tutor_id) VALUES ($1, $2);`, [
      roomId,
      coTutorId,
    ]);

    await dataSource.query(`INSERT INTO room_students (room_id, student_id) VALUES ($1, $2);`, [
      roomId,
      studentId,
    ]);

    const [otherRoom] = await dataSource.query<[{ id: string }]>(
      `INSERT INTO rooms (tutor_id, name, course_code, room_code, semester, active)
       VALUES ($1, 'Estruturas de Dados', 'EXA456', 'ROOM5678', '2026.2', true)
       RETURNING id;`,
      [otherTutorId],
    );
    otherRoomId = otherRoom.id;

    await insertDefaultPerformanceTable(dataSource, ownerTutorId);
    await insertDefaultPerformanceTable(dataSource, otherTutorId);

    const [problem] = await dataSource.query<[{ id: string }]>(
      `INSERT INTO problems (room_id, title, description, order_index, created_by)
       VALUES ($1, 'Problema 1 - Sistema Hospitalar', 'Descrição do problema', 1, $2)
       RETURNING id;`,
      [roomId, ownerTutorId],
    );
    problemId = problem.id;

    const [otherProblem] = await dataSource.query<[{ id: string }]>(
      `INSERT INTO problems (room_id, title, description, order_index, created_by)
       VALUES ($1, 'Problema 1 - Arvores B', 'Outro problema', 1, $2)
       RETURNING id;`,
      [otherRoomId, otherTutorId],
    );
    otherProblemId = otherProblem.id;

    ownerToken = signAccessToken(app, ownerTutorId, 'carlos@uefs.br', UserType.TUTOR);
    coTutorToken = signAccessToken(app, coTutorId, 'maria@uefs.br', UserType.TUTOR);
    otherTutorToken = signAccessToken(app, otherTutorId, 'ana@uefs.br', UserType.TUTOR);
    studentToken = signAccessToken(app, studentId, 'joao@discente.uefs.br', UserType.STUDENT);
  });

  const createSessionHelper = async (
    targetRoomId = roomId,
    targetProblemId = problemId,
    payload: object = validSessionPayload,
    token = ownerToken,
  ) => {
    return server()
      .post(`/api/salas/${targetRoomId}/problemas/${targetProblemId}/sessoes`)
      .set('Authorization', `Bearer ${token}`)
      .send(payload);
  };

  describe('Authorization matrix for session operations', () => {
    let createdSessionId: string;

    beforeEach(async () => {
      const res = await createSessionHelper();
      expect(res.status).toBe(201);
      createdSessionId = (res.body as SessionCreatedResponseBody).id;
    });

    describe('POST /salas/:roomId/problemas/:problemId/sessoes', () => {
      it('returns 401 Unauthorized when request lacks authorization token', async () => {
        const response = await server()
          .post(`/api/salas/${roomId}/problemas/${problemId}/sessoes`)
          .send(validSessionPayload);

        expect(response.status).toBe(401);
      });

      it('returns 403 Forbidden when a student attempts to create a session', async () => {
        const response = await createSessionHelper(
          roomId,
          problemId,
          validSessionPayload,
          studentToken,
        );
        expect(response.status).toBe(403);
      });

      it('returns 403 Forbidden when a tutor not linked to the room attempts to create a session', async () => {
        const response = await createSessionHelper(
          roomId,
          problemId,
          validSessionPayload,
          otherTutorToken,
        );
        expect(response.status).toBe(403);
      });

      it('returns 201 Created when room owner creates a session', async () => {
        const response = await createSessionHelper(
          roomId,
          problemId,
          {
            titulo: 'Sessão do Professor Responsável',
            descricao: 'Desc',
            data: '16-10-2026',
          },
          ownerToken,
        );

        expect(response.status).toBe(201);
      });

      it('returns 201 Created when co-tutor creates a session', async () => {
        const response = await createSessionHelper(
          roomId,
          problemId,
          {
            titulo: 'Sessão criada pela Co-tutora',
            descricao: 'Desc',
            data: '17-10-2026',
          },
          coTutorToken,
        );

        expect(response.status).toBe(201);
      });
    });

    describe('GET /salas/:roomId/problemas/:problemId/sessoes', () => {
      it('returns 401 Unauthorized when request lacks authorization token', async () => {
        const response = await server().get(`/api/salas/${roomId}/problemas/${problemId}/sessoes`);

        expect(response.status).toBe(401);
      });

      it('returns 403 Forbidden when a student attempts to list sessions', async () => {
        const response = await server()
          .get(`/api/salas/${roomId}/problemas/${problemId}/sessoes`)
          .set('Authorization', `Bearer ${studentToken}`);

        expect(response.status).toBe(403);
      });

      it('returns 403 Forbidden when a tutor not linked to the room attempts to list sessions', async () => {
        const response = await server()
          .get(`/api/salas/${roomId}/problemas/${problemId}/sessoes`)
          .set('Authorization', `Bearer ${otherTutorToken}`);

        expect(response.status).toBe(403);
      });

      it('returns 200 OK when room owner lists sessions', async () => {
        const response = await server()
          .get(`/api/salas/${roomId}/problemas/${problemId}/sessoes`)
          .set('Authorization', `Bearer ${ownerToken}`);

        expect(response.status).toBe(200);
      });

      it('returns 200 OK when co-tutor lists sessions', async () => {
        const response = await server()
          .get(`/api/salas/${roomId}/problemas/${problemId}/sessoes`)
          .set('Authorization', `Bearer ${coTutorToken}`);

        expect(response.status).toBe(200);
      });
    });

    describe('GET /salas/:roomId/problemas/:problemId/sessoes/:sessionId', () => {
      it('returns 401 Unauthorized when request lacks authorization token', async () => {
        const response = await server().get(
          `/api/salas/${roomId}/problemas/${problemId}/sessoes/${createdSessionId}`,
        );

        expect(response.status).toBe(401);
      });

      it('returns 403 Forbidden when a student attempts to get session detail', async () => {
        const response = await server()
          .get(`/api/salas/${roomId}/problemas/${problemId}/sessoes/${createdSessionId}`)
          .set('Authorization', `Bearer ${studentToken}`);

        expect(response.status).toBe(403);
      });

      it('returns 403 Forbidden when an outside tutor attempts to get session detail', async () => {
        const response = await server()
          .get(`/api/salas/${roomId}/problemas/${problemId}/sessoes/${createdSessionId}`)
          .set('Authorization', `Bearer ${otherTutorToken}`);

        expect(response.status).toBe(403);
      });

      it('returns 200 OK when room owner gets session detail', async () => {
        const response = await server()
          .get(`/api/salas/${roomId}/problemas/${problemId}/sessoes/${createdSessionId}`)
          .set('Authorization', `Bearer ${ownerToken}`);

        expect(response.status).toBe(200);
      });

      it('returns 200 OK when co-tutor gets session detail', async () => {
        const response = await server()
          .get(`/api/salas/${roomId}/problemas/${problemId}/sessoes/${createdSessionId}`)
          .set('Authorization', `Bearer ${coTutorToken}`);

        expect(response.status).toBe(200);
      });
    });

    describe('PUT /salas/:roomId/problemas/:problemId/sessoes/:sessionId', () => {
      const updatePayload = {
        titulo: 'Título Atualizado',
        descricao: 'Nova descrição',
        data: '20-10-2026',
      };

      it('returns 401 Unauthorized when request lacks authorization token', async () => {
        const response = await server()
          .put(`/api/salas/${roomId}/problemas/${problemId}/sessoes/${createdSessionId}`)
          .send(updatePayload);

        expect(response.status).toBe(401);
      });

      it('returns 403 Forbidden when student attempts to update session', async () => {
        const response = await server()
          .put(`/api/salas/${roomId}/problemas/${problemId}/sessoes/${createdSessionId}`)
          .set('Authorization', `Bearer ${studentToken}`)
          .send(updatePayload);

        expect(response.status).toBe(403);
      });

      it('returns 403 Forbidden when outside tutor attempts to update session', async () => {
        const response = await server()
          .put(`/api/salas/${roomId}/problemas/${problemId}/sessoes/${createdSessionId}`)
          .set('Authorization', `Bearer ${otherTutorToken}`)
          .send(updatePayload);

        expect(response.status).toBe(403);
      });

      it('returns 200 OK when co-tutor updates session', async () => {
        const response = await server()
          .put(`/api/salas/${roomId}/problemas/${problemId}/sessoes/${createdSessionId}`)
          .set('Authorization', `Bearer ${coTutorToken}`)
          .send(updatePayload);

        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({
          titulo: updatePayload.titulo,
          descricao: updatePayload.descricao,
          data: updatePayload.data,
        });
      });

      it('returns 200 OK when owner updates session', async () => {
        const response = await server()
          .put(`/api/salas/${roomId}/problemas/${problemId}/sessoes/${createdSessionId}`)
          .set('Authorization', `Bearer ${ownerToken}`)
          .send(updatePayload);

        expect(response.status).toBe(200);
      });
    });

    describe('GET /salas/:roomId/problemas/:problemId/sessoes/:sessionId/impacto-exclusao', () => {
      it('returns 401 Unauthorized when request lacks authorization token', async () => {
        const response = await server().get(
          `/api/salas/${roomId}/problemas/${problemId}/sessoes/${createdSessionId}/impacto-exclusao`,
        );

        expect(response.status).toBe(401);
      });

      it('returns 403 Forbidden when student requests deletion impact', async () => {
        const response = await server()
          .get(
            `/api/salas/${roomId}/problemas/${problemId}/sessoes/${createdSessionId}/impacto-exclusao`,
          )
          .set('Authorization', `Bearer ${studentToken}`);

        expect(response.status).toBe(403);
      });

      it('returns 403 Forbidden when outside tutor requests deletion impact', async () => {
        const response = await server()
          .get(
            `/api/salas/${roomId}/problemas/${problemId}/sessoes/${createdSessionId}/impacto-exclusao`,
          )
          .set('Authorization', `Bearer ${otherTutorToken}`);

        expect(response.status).toBe(403);
      });

      it('returns 200 OK when co-tutor requests deletion impact', async () => {
        const response = await server()
          .get(
            `/api/salas/${roomId}/problemas/${problemId}/sessoes/${createdSessionId}/impacto-exclusao`,
          )
          .set('Authorization', `Bearer ${coTutorToken}`);

        expect(response.status).toBe(200);
      });

      it('returns 200 OK when owner requests deletion impact', async () => {
        const response = await server()
          .get(
            `/api/salas/${roomId}/problemas/${problemId}/sessoes/${createdSessionId}/impacto-exclusao`,
          )
          .set('Authorization', `Bearer ${ownerToken}`);

        expect(response.status).toBe(200);
      });
    });

    describe('DELETE /salas/:roomId/problemas/:problemId/sessoes/:sessionId', () => {
      it('returns 401 Unauthorized when request lacks authorization token', async () => {
        const response = await server().delete(
          `/api/salas/${roomId}/problemas/${problemId}/sessoes/${createdSessionId}`,
        );

        expect(response.status).toBe(401);
      });

      it('returns 403 Forbidden when student attempts to delete session', async () => {
        const response = await server()
          .delete(`/api/salas/${roomId}/problemas/${problemId}/sessoes/${createdSessionId}`)
          .set('Authorization', `Bearer ${studentToken}`);

        expect(response.status).toBe(403);
      });

      it('returns 403 Forbidden when outside tutor attempts to delete session', async () => {
        const response = await server()
          .delete(`/api/salas/${roomId}/problemas/${problemId}/sessoes/${createdSessionId}`)
          .set('Authorization', `Bearer ${otherTutorToken}`);

        expect(response.status).toBe(403);
      });

      it('returns 204 No Content when co-tutor deletes session', async () => {
        const response = await server()
          .delete(`/api/salas/${roomId}/problemas/${problemId}/sessoes/${createdSessionId}`)
          .set('Authorization', `Bearer ${coTutorToken}`);

        expect(response.status).toBe(204);
      });

      it('returns 204 No Content when owner deletes session', async () => {
        const createRes = await createSessionHelper();
        const sessionId = (createRes.body as SessionCreatedResponseBody).id;

        const response = await server()
          .delete(`/api/salas/${roomId}/problemas/${problemId}/sessoes/${sessionId}`)
          .set('Authorization', `Bearer ${ownerToken}`);

        expect(response.status).toBe(204);
      });
    });
  });

  describe('POST /salas/:roomId/problemas/:problemId/sessoes', () => {
    it('creates a session with automatic order 1 and default status agendada', async () => {
      const response = await createSessionHelper();

      expect(response.status).toBe(201);
      const body = response.body as SessionCreatedResponseBody;
      expect(body).toMatchObject({
        problemaId: problemId,
        titulo: validSessionPayload.titulo,
        descricao: validSessionPayload.descricao,
        data: validSessionPayload.data,
        ordem: 1,
        status: 'agendada',
      });
      expect(body.id).toBeDefined();

      const [stored] = await dataSource.query<[{ date: string }]>(
        "SELECT to_char(date, 'YYYY-MM-DD') AS date FROM sessions WHERE id = $1;",
        [body.id],
      );
      expect(stored.date).toBe('2026-10-15');
    });

    it('trims leading and trailing whitespace from title and description', async () => {
      const response = await createSessionHelper(roomId, problemId, {
        titulo: '  Sessão com Espaços  ',
        descricao: '   Descrição com espaços extras   ',
        data: '18-10-2026',
      });

      expect(response.status).toBe(201);
      const body = response.body as SessionCreatedResponseBody;
      expect(body.titulo).toBe('Sessão com Espaços');
      expect(body.descricao).toBe('Descrição com espaços extras');
    });

    it('accepts null description', async () => {
      const response = await createSessionHelper(roomId, problemId, {
        titulo: 'Sessão Sem Descrição',
        descricao: null,
        data: '19-10-2026',
      });

      expect(response.status).toBe(201);
      const body = response.body as SessionCreatedResponseBody;
      expect(body.descricao).toBeNull();
    });

    it('automatically increments the order for subsequent sessions in the same problem', async () => {
      const res1 = await createSessionHelper(roomId, problemId, {
        titulo: 'Primeira Sessão',
        descricao: null,
        data: '01-10-2026',
      });
      const res2 = await createSessionHelper(roomId, problemId, {
        titulo: 'Segunda Sessão',
        descricao: null,
        data: '08-10-2026',
      });
      const res3 = await createSessionHelper(roomId, problemId, {
        titulo: 'Terceira Sessão',
        descricao: null,
        data: '15-10-2026',
      });

      expect(res1.status).toBe(201);
      expect(res2.status).toBe(201);
      expect(res3.status).toBe(201);

      expect((res1.body as SessionCreatedResponseBody).ordem).toBe(1);
      expect((res2.body as SessionCreatedResponseBody).ordem).toBe(2);
      expect((res3.body as SessionCreatedResponseBody).ordem).toBe(3);
    });

    it('maintains independent order sequences per problem', async () => {
      const [anotherProblem] = await dataSource.query<[{ id: string }]>(
        `INSERT INTO problems (room_id, title, description, order_index, created_by)
         VALUES ($1, 'Problema 2', 'Desc 2', 2, $2)
         RETURNING id;`,
        [roomId, ownerTutorId],
      );

      const prob1Session1 = await createSessionHelper(roomId, problemId, {
        titulo: 'Prob1 - Sessão 1',
        descricao: null,
        data: '01-10-2026',
      });
      const prob2Session1 = await createSessionHelper(roomId, anotherProblem.id, {
        titulo: 'Prob2 - Sessão 1',
        descricao: null,
        data: '01-10-2026',
      });
      const prob1Session2 = await createSessionHelper(roomId, problemId, {
        titulo: 'Prob1 - Sessão 2',
        descricao: null,
        data: '08-10-2026',
      });

      expect((prob1Session1.body as SessionCreatedResponseBody).ordem).toBe(1);
      expect((prob2Session1.body as SessionCreatedResponseBody).ordem).toBe(1);
      expect((prob1Session2.body as SessionCreatedResponseBody).ordem).toBe(2);
    });

    it('assigns unique sequential order indices during concurrent creation requests', async () => {
      const requests = Array.from({ length: 4 }, (_, i) =>
        createSessionHelper(roomId, problemId, {
          titulo: `Sessão Concorrente ${i + 1}`,
          descricao: null,
          data: `0${i + 1}-10-2026`,
        }),
      );

      const responses = await Promise.all(requests);
      responses.forEach((res) => expect(res.status).toBe(201));

      const orders = responses
        .map((r) => (r.body as SessionCreatedResponseBody).ordem)
        .sort((a, b) => a - b);
      expect(orders).toEqual([1, 2, 3, 4]);
    });

    it('returns 400 Bad Request when title is missing', async () => {
      const response = await createSessionHelper(roomId, problemId, {
        titulo: undefined as unknown as string,
        descricao: null,
        data: '15-10-2026',
      });

      expect(response.status).toBe(400);
    });

    it('returns 400 Bad Request when title is empty or only whitespace', async () => {
      const response = await createSessionHelper(roomId, problemId, {
        titulo: '   ',
        descricao: null,
        data: '15-10-2026',
      });

      expect(response.status).toBe(400);
    });

    it('returns 400 Bad Request when title exceeds 120 characters', async () => {
      const response = await createSessionHelper(roomId, problemId, {
        titulo: 'A'.repeat(121),
        descricao: null,
        data: '15-10-2026',
      });

      expect(response.status).toBe(400);
    });

    it('returns 400 Bad Request when description exceeds 1000 characters', async () => {
      const response = await createSessionHelper(roomId, problemId, {
        titulo: 'Sessão com Descrição Longa',
        descricao: 'D'.repeat(1001),
        data: '15-10-2026',
      });

      expect(response.status).toBe(400);
    });

    it('returns 400 Bad Request when date is missing', async () => {
      const response = await createSessionHelper(roomId, problemId, {
        titulo: 'Sessão Sem Data',
        descricao: null,
        data: undefined as unknown as string,
      });

      expect(response.status).toBe(400);
    });

    it('returns 400 Bad Request when date includes timestamp or invalid format', async () => {
      const invalidDates = [
        '15-10-2026T14:30:00Z',
        '15/10/2026',
        '2026/10/15',
        'amanha',
        '45-13-2026',
      ];

      for (const invalidDate of invalidDates) {
        const response = await createSessionHelper(roomId, problemId, {
          titulo: 'Sessão Data Inválida',
          descricao: null,
          data: invalidDate,
        });

        expect(response.status).toBe(400);
      }
    });

    it('returns 404 Not Found when room does not exist', async () => {
      const nonExistentRoomId = '00000000-0000-0000-0000-000000000000';
      const response = await createSessionHelper(nonExistentRoomId, problemId);

      expect(response.status).toBe(404);
    });

    it('returns 404 Not Found when problem does not exist', async () => {
      const nonExistentProblemId = '00000000-0000-0000-0000-000000000000';
      const response = await createSessionHelper(roomId, nonExistentProblemId);

      expect(response.status).toBe(404);
    });

    it('returns 404 Not Found when problem belongs to another room', async () => {
      const response = await createSessionHelper(roomId, otherProblemId);

      expect(response.status).toBe(404);
    });
  });

  describe('GET /salas/:roomId/problemas/:problemId/sessoes', () => {
    it('returns 200 OK with empty array when problem has no sessions', async () => {
      const response = await server()
        .get(`/api/salas/${roomId}/problemas/${problemId}/sessoes`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it('returns 200 OK with sessions sorted by date ASC and order ASC', async () => {
      await createSessionHelper(roomId, problemId, {
        titulo: 'Sessão 2 - Fechamento',
        descricao: null,
        data: '22-10-2026',
      });
      await createSessionHelper(roomId, problemId, {
        titulo: 'Sessão 1 - Abertura',
        descricao: null,
        data: '15-10-2026',
      });
      await createSessionHelper(roomId, problemId, {
        titulo: 'Sessão Intermediária',
        descricao: null,
        data: '15-10-2026',
      });

      const response = await server()
        .get(`/api/salas/${roomId}/problemas/${problemId}/sessoes`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(response.status).toBe(200);
      const list = response.body as SessionResponseBody[];
      expect(list).toHaveLength(3);

      expect(list[0].titulo).toBe('Sessão 1 - Abertura');
      expect(list[0].data).toBe('15-10-2026');
      expect(list[0].ordem).toBe(2);

      expect(list[1].titulo).toBe('Sessão Intermediária');
      expect(list[1].data).toBe('15-10-2026');
      expect(list[1].ordem).toBe(3);

      expect(list[2].titulo).toBe('Sessão 2 - Fechamento');
      expect(list[2].data).toBe('22-10-2026');
      expect(list[2].ordem).toBe(1);
    });

    it('returns 404 Not Found when problem belongs to another room', async () => {
      const response = await server()
        .get(`/api/salas/${roomId}/problemas/${otherProblemId}/sessoes`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('GET /salas/:roomId/problemas/:problemId/sessoes/:sessionId', () => {
    it('returns 200 OK with detailed session including salaId and problemaId', async () => {
      const createRes = await createSessionHelper();
      const sessionId = (createRes.body as SessionCreatedResponseBody).id;

      const response = await server()
        .get(`/api/salas/${roomId}/problemas/${problemId}/sessoes/${sessionId}`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(response.status).toBe(200);
      const body = response.body as SessionDetailResponseBody;
      expect(body).toMatchObject({
        id: sessionId,
        problemaId: problemId,
        salaId: roomId,
        titulo: validSessionPayload.titulo,
        descricao: validSessionPayload.descricao,
        data: validSessionPayload.data,
        ordem: 1,
        status: 'agendada',
      });
    });

    it('returns 404 Not Found when session does not exist', async () => {
      const nonExistentSessionId = '00000000-0000-0000-0000-000000000000';
      const response = await server()
        .get(`/api/salas/${roomId}/problemas/${problemId}/sessoes/${nonExistentSessionId}`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(response.status).toBe(404);
    });

    it('returns 404 Not Found when session belongs to a different problem', async () => {
      const otherRes = await createSessionHelper(
        otherRoomId,
        otherProblemId,
        validSessionPayload,
        otherTutorToken,
      );
      const otherSessionId = (otherRes.body as SessionCreatedResponseBody).id;

      const response = await server()
        .get(`/api/salas/${roomId}/problemas/${problemId}/sessoes/${otherSessionId}`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /salas/:roomId/problemas/:problemId/sessoes/:sessionId', () => {
    it('updates title, description, and date successfully while preserving order and status', async () => {
      const createRes = await createSessionHelper();
      const sessionId = (createRes.body as SessionCreatedResponseBody).id;

      const response = await server()
        .put(`/api/salas/${roomId}/problemas/${problemId}/sessoes/${sessionId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          titulo: 'Título Atualizado',
          descricao: 'Descrição Atualizada',
          data: '30-10-2026',
        });

      expect(response.status).toBe(200);
      const body = response.body as SessionDetailResponseBody;
      expect(body).toMatchObject({
        id: sessionId,
        problemaId: problemId,
        salaId: roomId,
        titulo: 'Título Atualizado',
        descricao: 'Descrição Atualizada',
        data: '30-10-2026',
        ordem: 1,
        status: 'agendada',
      });
    });

    it('allows updating description to null', async () => {
      const createRes = await createSessionHelper();
      const sessionId = (createRes.body as SessionCreatedResponseBody).id;

      const response = await server()
        .put(`/api/salas/${roomId}/problemas/${problemId}/sessoes/${sessionId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          titulo: 'Título Mantido',
          descricao: null,
          data: '15-10-2026',
        });

      expect(response.status).toBe(200);
      expect((response.body as SessionDetailResponseBody).descricao).toBeNull();
    });

    it('returns 400 Bad Request when updated title is invalid or empty', async () => {
      const createRes = await createSessionHelper();
      const sessionId = (createRes.body as SessionCreatedResponseBody).id;

      const response = await server()
        .put(`/api/salas/${roomId}/problemas/${problemId}/sessoes/${sessionId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          titulo: '   ',
          descricao: null,
          data: '15-10-2026',
        });

      expect(response.status).toBe(400);
    });

    it('returns 404 Not Found when updating a non-existent session', async () => {
      const nonExistentSessionId = '00000000-0000-0000-0000-000000000000';
      const response = await server()
        .put(`/api/salas/${roomId}/problemas/${problemId}/sessoes/${nonExistentSessionId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          titulo: 'Novo Título',
          descricao: null,
          data: '15-10-2026',
        });

      expect(response.status).toBe(404);
    });
  });

  describe('GET /salas/:roomId/problemas/:problemId/sessoes/:sessionId/impacto-exclusao', () => {
    it('returns 200 OK with podeExcluir true and 0 for all counts on empty session', async () => {
      const createRes = await createSessionHelper();
      const sessionId = (createRes.body as SessionCreatedResponseBody).id;

      const response = await server()
        .get(`/api/salas/${roomId}/problemas/${problemId}/sessoes/${sessionId}/impacto-exclusao`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(response.status).toBe(200);
      const body = response.body as SessionDeletionImpactResponseBody;
      expect(body).toEqual({
        podeExcluir: true,
        chamada: 0,
        papeis: 0,
        observacoes: 0,
        avaliacoes: 0,
        feedbacks: 0,
      });
    });

    it('returns 404 Not Found when session does not exist', async () => {
      const nonExistentSessionId = '00000000-0000-0000-0000-000000000000';
      const response = await server()
        .get(
          `/api/salas/${roomId}/problemas/${problemId}/sessoes/${nonExistentSessionId}/impacto-exclusao`,
        )
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /salas/:roomId/problemas/:problemId/sessoes/:sessionId', () => {
    it('deletes an empty session with 204 No Content', async () => {
      const createRes = await createSessionHelper();
      const sessionId = (createRes.body as SessionCreatedResponseBody).id;

      const deleteRes = await server()
        .delete(`/api/salas/${roomId}/problemas/${problemId}/sessoes/${sessionId}`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(deleteRes.status).toBe(204);

      const getRes = await server()
        .get(`/api/salas/${roomId}/problemas/${problemId}/sessoes/${sessionId}`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(getRes.status).toBe(404);
    });

    it('reorders subsequent sessions without gaps when a middle session is deleted', async () => {
      const res1 = await createSessionHelper(roomId, problemId, {
        titulo: 'Sessão 1',
        descricao: null,
        data: '01-10-2026',
      });
      const res2 = await createSessionHelper(roomId, problemId, {
        titulo: 'Sessão 2',
        descricao: null,
        data: '08-10-2026',
      });
      const res3 = await createSessionHelper(roomId, problemId, {
        titulo: 'Sessão 3',
        descricao: null,
        data: '15-10-2026',
      });

      const s1 = res1.body as SessionCreatedResponseBody;
      const s2 = res2.body as SessionCreatedResponseBody;
      const s3 = res3.body as SessionCreatedResponseBody;

      expect(s1.ordem).toBe(1);
      expect(s2.ordem).toBe(2);
      expect(s3.ordem).toBe(3);

      const deleteRes = await server()
        .delete(`/api/salas/${roomId}/problemas/${problemId}/sessoes/${s2.id}`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(deleteRes.status).toBe(204);

      const listRes = await server()
        .get(`/api/salas/${roomId}/problemas/${problemId}/sessoes`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(listRes.status).toBe(200);
      const list = listRes.body as SessionResponseBody[];
      expect(list).toHaveLength(2);

      const session1Updated = list.find((s) => s.id === s1.id);
      const session3Updated = list.find((s) => s.id === s3.id);

      expect(session1Updated?.ordem).toBe(1);
      expect(session3Updated?.ordem).toBe(2);
    });

    it('returns 404 Not Found when session does not exist', async () => {
      const nonExistentSessionId = '00000000-0000-0000-0000-000000000000';
      const response = await server()
        .delete(`/api/salas/${roomId}/problemas/${problemId}/sessoes/${nonExistentSessionId}`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('Problem deletion blocking rule (Integration with Problems module)', () => {
    it('reports session count in problem deletion impact', async () => {
      await createSessionHelper(roomId, problemId, {
        titulo: 'Sessão A',
        descricao: null,
        data: '01-10-2026',
      });
      await createSessionHelper(roomId, problemId, {
        titulo: 'Sessão B',
        descricao: null,
        data: '08-10-2026',
      });

      const impactRes = await server()
        .get(`/api/salas/${roomId}/problemas/${problemId}/impacto-exclusao`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(impactRes.status).toBe(200);
      const impact = impactRes.body as ProblemDeletionImpactResponseBody;
      expect(impact.sessoes).toBe(2);
    });

    it('blocks problem deletion with 409 Conflict when problem has sessions', async () => {
      await createSessionHelper();

      const deleteProblemRes = await server()
        .delete(`/api/salas/${roomId}/problemas/${problemId}`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(deleteProblemRes.status).toBe(409);
      const body = deleteProblemRes.body as ErrorResponseBody;
      expect(body.message).toBe(
        'O problema não pode ser excluído pois possui registros vinculados.',
      );
      expect(deleteProblemRes.body).toMatchObject({
        detalhes: { sessoes: 1, notas: 0, feedbacks: 0, avaliacoes: 0 },
      });
    });

    it('allows problem deletion with 204 No Content once all its sessions are deleted', async () => {
      const createSessionRes = await createSessionHelper();
      const sessionId = (createSessionRes.body as SessionCreatedResponseBody).id;

      const deleteSessionRes = await server()
        .delete(`/api/salas/${roomId}/problemas/${problemId}/sessoes/${sessionId}`)
        .set('Authorization', `Bearer ${ownerToken}`);
      expect(deleteSessionRes.status).toBe(204);

      const deleteProblemRes = await server()
        .delete(`/api/salas/${roomId}/problemas/${problemId}`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(deleteProblemRes.status).toBe(204);
    });
  });
});
