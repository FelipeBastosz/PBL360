import { type INestApplication } from '@nestjs/common';
import { type TestingModule } from '@nestjs/testing';
import type { Server } from 'node:http';
import request from 'supertest';
import { DataSource } from 'typeorm';

import { UserType } from '@/users/domain/enums/user-type.enum';
import { createTestApp } from './helpers/create-test-app';
import { signAccessToken } from './helpers/fixtures';

interface ProblemResponseBody {
  id: string;
  salaId: string;
  titulo: string;
  descricao: string | null;
  ordem: number;
  dataInicio: string | null;
  dataFim: string | null;
  criadoPor: string;
}

interface ErrorResponseBody {
  statusCode: number;
  message: string | string[];
  error: string;
}

describe('Problems (e2e)', () => {
  let moduleRef: TestingModule;
  let app: INestApplication;
  let dataSource: DataSource;

  let tutor1Id: string;
  let tutor2Id: string;
  let studentId: string;
  let roomId: string;

  let tutor1Token: string;
  let tutor2Token: string;
  let studentToken: string;

  beforeAll(async () => {
    ({ app, moduleRef } = await createTestApp());

    dataSource = moduleRef.get(DataSource);
  });

  const cleanupDb = async () => {
    await dataSource.query('DELETE FROM problems;');
    await dataSource.query('DELETE FROM room_tutors;');
    await dataSource.query('DELETE FROM rooms;');
    await dataSource.query('DELETE FROM users;');
  };

  afterAll(async () => {
    await cleanupDb();
    await app.close();
  });

  beforeEach(async () => {
    await cleanupDb();

    const [tutor1] = await dataSource.query<[{ id: string }]>(
      `INSERT INTO users (name, email, password_hash, type, active)
       VALUES ('Carlos Tutor', 'carlos@uefs.br', 'hash', '${UserType.TUTOR}', true)
       RETURNING id;`,
    );
    tutor1Id = tutor1.id;

    const [tutor2] = await dataSource.query<[{ id: string }]>(
      `INSERT INTO users (name, email, password_hash, type, active)
       VALUES ('Maria Tutora', 'maria@uefs.br', 'hash', '${UserType.TUTOR}', true)
       RETURNING id;`,
    );
    tutor2Id = tutor2.id;

    const [student] = await dataSource.query<[{ id: string }]>(
      `INSERT INTO users (name, email, password_hash, type, active)
       VALUES ('João Aluno', 'joao@discente.uefs.br', 'hash', '${UserType.STUDENT}', true)
       RETURNING id;`,
    );
    studentId = student.id;

    const [room] = await dataSource.query<[{ id: string }]>(
      `INSERT INTO rooms (tutor_id, name, course_code, room_code, semester, active)
       VALUES ($1, 'Engenharia de Software', 'EXA123', 'ROOM1234', '2026.2', true)
       RETURNING id;`,
      [tutor1Id],
    );
    roomId = room.id;

    await dataSource.query(`INSERT INTO room_tutors (room_id, tutor_id) VALUES ($1, $2);`, [
      roomId,
      tutor1Id,
    ]);

    tutor1Token = signAccessToken(app, tutor1Id, 'carlos@uefs.br', UserType.TUTOR);
    tutor2Token = signAccessToken(app, tutor2Id, 'maria@uefs.br', UserType.TUTOR);
    studentToken = signAccessToken(app, studentId, 'joao@discente.uefs.br', UserType.STUDENT);
  });

  const postProblem = (targetRoomId: string, payload: object, token?: string) => {
    const req = request(app.getHttpServer() as Server).post(`/api/salas/${targetRoomId}/problemas`);

    if (token) {
      req.set('Authorization', `Bearer ${token}`);
    }

    return req.send(payload);
  };

  const getProblems = (targetRoomId: string, token?: string) => {
    const req = request(app.getHttpServer() as Server).get(`/api/salas/${targetRoomId}/problemas`);

    if (token) {
      req.set('Authorization', `Bearer ${token}`);
    }

    return req;
  };

  const getProblemById = (targetRoomId: string, targetProblemId: string, token?: string) => {
    const req = request(app.getHttpServer() as Server).get(
      `/api/salas/${targetRoomId}/problemas/${targetProblemId}`,
    );

    if (token) {
      req.set('Authorization', `Bearer ${token}`);
    }

    return req;
  };

  it('registers a problem successfully with automatically assigned order 1', async () => {
    const response = await postProblem(
      roomId,
      {
        titulo: 'Problema 1 - Primeiros Socorros',
        descricao: 'Descrição detalhada do caso clínico.',
        dataInicio: '2026-03-01',
        dataFim: '2026-03-15',
      },
      tutor1Token,
    ).expect(201);

    const body = response.body as ProblemResponseBody;
    expect(body.id).toBeDefined();
    expect(body.salaId).toBe(roomId);
    expect(body.titulo).toBe('Problema 1 - Primeiros Socorros');
    expect(body.descricao).toBe('Descrição detalhada do caso clínico.');
    expect(body.ordem).toBe(1);
    expect(body.criadoPor).toBe(tutor1Id);
    expect(body.dataInicio).toBe('2026-03-01');
    expect(body.dataFim).toBe('2026-03-15');
  });

  it('rejects dates with a time component', async () => {
    const body = (
      await postProblem(
        roomId,
        { titulo: 'P', dataInicio: '2026-03-01T00:00:00.000Z' },
        tutor1Token,
      ).expect(400)
    ).body as ErrorResponseBody;

    expect(body.message).toContain('A data de início deve estar no formato AAAA-MM-DD.');
  });

  it('rejects an end date before the start date', async () => {
    const body = (
      await postProblem(
        roomId,
        { titulo: 'P', dataInicio: '2026-03-15', dataFim: '2026-03-01' },
        tutor1Token,
      ).expect(400)
    ).body as ErrorResponseBody;

    expect(body.message).toContain('A data de término não pode ser anterior à data de início.');
  });

  it('does not accept problems in a deleted room', async () => {
    await dataSource.query('UPDATE rooms SET deleted_at = now() WHERE id = $1;', [roomId]);

    await postProblem(roomId, { titulo: 'P' }, tutor1Token).expect(404);
  });

  it('increments the order automatically for sequential problem creations', async () => {
    const res1 = await postProblem(roomId, { titulo: 'Problema 1' }, tutor1Token).expect(201);
    const res2 = await postProblem(roomId, { titulo: 'Problema 2' }, tutor1Token).expect(201);
    const res3 = await postProblem(roomId, { titulo: 'Problema 3' }, tutor1Token).expect(201);

    const body1 = res1.body as ProblemResponseBody;
    const body2 = res2.body as ProblemResponseBody;
    const body3 = res3.body as ProblemResponseBody;

    expect(body1.ordem).toBe(1);
    expect(body2.ordem).toBe(2);
    expect(body3.ordem).toBe(3);
  });

  it('prevents race conditions and assigns unique order indices on concurrent requests', async () => {
    const requests = [
      postProblem(roomId, { titulo: 'Concorrente A' }, tutor1Token),
      postProblem(roomId, { titulo: 'Concorrente B' }, tutor1Token),
      postProblem(roomId, { titulo: 'Concorrente C' }, tutor1Token),
    ];

    const responses = await Promise.all(requests);
    const orderIndices = responses.map((res) => {
      expect(res.status).toBe(201);
      const body = res.body as ProblemResponseBody;
      return body.ordem;
    });

    const uniqueIndices = new Set(orderIndices);
    expect(uniqueIndices.size).toBe(3);
    expect(orderIndices.sort()).toEqual([1, 2, 3]);
  });

  it('returns 400 Bad Request when title is missing or empty', async () => {
    const response = await postProblem(roomId, { titulo: '' }, tutor1Token).expect(400);

    const body = response.body as ErrorResponseBody;
    expect(body.message).toEqual(expect.arrayContaining(['O título do problema é obrigatório.']));
  });

  it('returns 400 Bad Request when title exceeds 120 characters', async () => {
    const response = await postProblem(roomId, { titulo: 'a'.repeat(121) }, tutor1Token).expect(
      400,
    );

    const body = response.body as ErrorResponseBody;
    expect(body.message).toEqual(
      expect.arrayContaining(['O título do problema deve ter no máximo 120 caracteres.']),
    );
  });

  it('returns 404 Not Found when room does not exist', async () => {
    const nonExistentRoomId = '00000000-0000-0000-0000-000000000000';
    const response = await postProblem(
      nonExistentRoomId,
      { titulo: 'Problema sem sala' },
      tutor1Token,
    ).expect(404);

    const body = response.body as ErrorResponseBody;
    expect(body.message).toBe('Sala não encontrada.');
  });

  it('returns 403 Forbidden when tutor has no permission in the room', async () => {
    const response = await postProblem(
      roomId,
      { titulo: 'Problema por outro professor' },
      tutor2Token,
    ).expect(403);

    const body = response.body as ErrorResponseBody;
    expect(body.message).toBe('Você não tem permissão para acessar ou modificar esta sala.');
  });

  it('returns 403 Forbidden when a student attempts to create a problem', async () => {
    await postProblem(roomId, { titulo: 'Tentativa de Aluno' }, studentToken).expect(403);
  });

  it('returns 401 Unauthorized when request lacks authorization token', async () => {
    await postProblem(roomId, { titulo: 'Sem Token' }).expect(401);
  });

  describe('GET /api/salas/:roomId/problemas', () => {
    it('returns 401 Unauthorized when request lacks authorization token', async () => {
      await getProblems(roomId).expect(401);
    });

    it('returns 403 Forbidden when a student attempts to list problems', async () => {
      await getProblems(roomId, studentToken).expect(403);
    });

    it('returns 403 Forbidden when tutor has no permission in the room', async () => {
      const response = await getProblems(roomId, tutor2Token).expect(403);
      const body = response.body as ErrorResponseBody;
      expect(body.message).toBe('Você não tem permissão para acessar ou modificar esta sala.');
    });

    it('returns 404 Not Found when room does not exist', async () => {
      const nonExistentRoomId = '00000000-0000-0000-0000-000000000000';
      const response = await getProblems(nonExistentRoomId, tutor1Token).expect(404);
      const body = response.body as ErrorResponseBody;
      expect(body.message).toBe('Sala não encontrada.');
    });

    it('returns 200 OK with empty array when room has no problems', async () => {
      const response = await getProblems(roomId, tutor1Token).expect(200);
      expect(response.body).toEqual([]);
    });

    it('returns 200 OK with problems ordered by creation', async () => {
      await postProblem(roomId, { titulo: 'Problema Alfa' }, tutor1Token).expect(201);
      await postProblem(roomId, { titulo: 'Problema Beta' }, tutor1Token).expect(201);
      await postProblem(roomId, { titulo: 'Problema Gama' }, tutor1Token).expect(201);

      const response = await getProblems(roomId, tutor1Token).expect(200);
      const body = response.body as ProblemResponseBody[];

      expect(body).toHaveLength(3);
      expect(body[0]?.titulo).toBe('Problema Alfa');
      expect(body[0]?.ordem).toBe(1);
      expect(body[1]?.titulo).toBe('Problema Beta');
      expect(body[1]?.ordem).toBe(2);
      expect(body[2]?.titulo).toBe('Problema Gama');
      expect(body[2]?.ordem).toBe(3);
    });
  });

  describe('GET /api/salas/:roomId/problemas/:problemId', () => {
    it('returns 401 Unauthorized when request lacks authorization token', async () => {
      const nonExistentProblemId = '00000000-0000-0000-0000-000000000000';
      await getProblemById(roomId, nonExistentProblemId).expect(401);
    });

    it('returns 403 Forbidden when a student attempts to get a problem', async () => {
      const nonExistentProblemId = '00000000-0000-0000-0000-000000000000';
      await getProblemById(roomId, nonExistentProblemId, studentToken).expect(403);
    });

    it('returns 403 Forbidden when tutor has no permission in the room', async () => {
      const nonExistentProblemId = '00000000-0000-0000-0000-000000000000';
      const response = await getProblemById(roomId, nonExistentProblemId, tutor2Token).expect(403);
      const body = response.body as ErrorResponseBody;
      expect(body.message).toBe('Você não tem permissão para acessar ou modificar esta sala.');
    });

    it('returns 404 Not Found when room does not exist', async () => {
      const nonExistentRoomId = '00000000-0000-0000-0000-000000000000';
      const nonExistentProblemId = '00000000-0000-0000-0000-000000000000';
      const response = await getProblemById(
        nonExistentRoomId,
        nonExistentProblemId,
        tutor1Token,
      ).expect(404);
      const body = response.body as ErrorResponseBody;
      expect(body.message).toBe('Sala não encontrada.');
    });

    it('returns 404 Not Found when problem does not exist', async () => {
      const nonExistentProblemId = '00000000-0000-0000-0000-000000000000';
      const response = await getProblemById(roomId, nonExistentProblemId, tutor1Token).expect(404);
      const body = response.body as ErrorResponseBody;
      expect(body.message).toBe('Problema não encontrado.');
    });

    it('returns 404 Not Found when problem exists but belongs to a different room', async () => {
      const [otherRoom] = await dataSource.query<[{ id: string }]>(
        `INSERT INTO rooms (tutor_id, name, course_code, room_code, semester, active)
         VALUES ($1, 'Outra Sala', 'EXA999', 'ROOM9999', '2026.2', true)
         RETURNING id;`,
        [tutor1Id],
      );
      await dataSource.query(`INSERT INTO room_tutors (room_id, tutor_id) VALUES ($1, $2);`, [
        otherRoom.id,
        tutor1Id,
      ]);

      const res = await postProblem(
        otherRoom.id,
        { titulo: 'Problema de Outra Sala' },
        tutor1Token,
      ).expect(201);
      const problemOfOtherRoom = res.body as ProblemResponseBody;

      const response = await getProblemById(roomId, problemOfOtherRoom.id, tutor1Token).expect(404);
      const body = response.body as ErrorResponseBody;
      expect(body.message).toBe('Problema não encontrado.');
    });

    it('returns 200 OK with problem details when problem belongs to the room', async () => {
      const res = await postProblem(
        roomId,
        {
          titulo: 'Problema Específico',
          descricao: 'Descrição detalhada do caso clínico.',
          dataInicio: '2026-03-01',
          dataFim: '2026-03-15',
        },
        tutor1Token,
      ).expect(201);
      const created = res.body as ProblemResponseBody;

      const response = await getProblemById(roomId, created.id, tutor1Token).expect(200);
      const body = response.body as ProblemResponseBody;

      expect(body.id).toBe(created.id);
      expect(body.salaId).toBe(roomId);
      expect(body.titulo).toBe('Problema Específico');
      expect(body.descricao).toBe('Descrição detalhada do caso clínico.');
      expect(body.ordem).toBe(1);
      expect(body.criadoPor).toBe(tutor1Id);
    });
  });
});
