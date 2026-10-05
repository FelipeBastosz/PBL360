import type { Server } from 'node:http';
import { type INestApplication } from '@nestjs/common';
import { type TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { DataSource } from 'typeorm';

import { UserType } from '@/users/domain/enums/user-type.enum';
import { createTestApp } from './helpers/create-test-app';
import { cleanDatabase, signAccessToken } from './helpers/fixtures';

interface SessionRoleResponseBody {
  alunoId: string;
  nome: string;
  papel: string;
  notaAdicional: number | null;
}

interface AssignedSessionRoleResponseBody {
  alunoId: string;
  papel: string | null;
  notaAdicional: number | null;
}

interface ConflictErrorResponseBody {
  statusCode: number;
  message: string;
  error: string;
  ocupadoPor?: {
    studentId: string;
    name: string;
  };
}

describe('Session Roles (e2e)', () => {
  let moduleRef: TestingModule;
  let app: INestApplication;
  let dataSource: DataSource;

  let ownerTutorId: string;
  let coTutorId: string;
  let otherTutorId: string;
  let student1Id: string;
  let student2Id: string;
  let unenrolledStudentId: string;

  let ownerToken: string;
  let coTutorToken: string;
  let otherTutorToken: string;
  let student1Token: string;

  let roomId: string;
  let problemId: string;
  let sessionId: string;
  let session2Id: string;

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

    const [student1] = await dataSource.query<[{ id: string }]>(
      `INSERT INTO users (name, email, password_hash, type, registration_number, active)
       VALUES ('Lucas Aluno Um', 'lucas@discente.uefs.br', 'hash', '${UserType.STUDENT}', '20260001', true)
       RETURNING id;`,
    );
    student1Id = student1.id;

    const [student2] = await dataSource.query<[{ id: string }]>(
      `INSERT INTO users (name, email, password_hash, type, registration_number, active)
       VALUES ('Beatriz Aluna Dois', 'beatriz@discente.uefs.br', 'hash', '${UserType.STUDENT}', '20260002', true)
       RETURNING id;`,
    );
    student2Id = student2.id;

    const [unenrolled] = await dataSource.query<[{ id: string }]>(
      `INSERT INTO users (name, email, password_hash, type, registration_number, active)
       VALUES ('Pedro Nao Matriculado', 'pedro@discente.uefs.br', 'hash', '${UserType.STUDENT}', '20260003', true)
       RETURNING id;`,
    );
    unenrolledStudentId = unenrolled.id;

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
      student1Id,
    ]);
    await dataSource.query(`INSERT INTO room_students (room_id, student_id) VALUES ($1, $2);`, [
      roomId,
      student2Id,
    ]);

    const [problem] = await dataSource.query<[{ id: string }]>(
      `INSERT INTO problems (room_id, title, description, order_index, created_by)
       VALUES ($1, 'Problema 1 - Sistema Hospitalar', 'Descrição do problema', 1, $2)
       RETURNING id;`,
      [roomId, ownerTutorId],
    );
    problemId = problem.id;

    const [sess1] = await dataSource.query<[{ id: string }]>(
      `INSERT INTO sessions (problem_id, title, description, date, order_index, status)
       VALUES ($1, 'Sessão 1 - Abertura', 'Abertura', '2026-10-15', 1, 'agendada')
       RETURNING id;`,
      [problemId],
    );
    sessionId = sess1.id;

    const [sess2] = await dataSource.query<[{ id: string }]>(
      `INSERT INTO sessions (problem_id, title, description, date, order_index, status)
       VALUES ($1, 'Sessão 2 - Fechamento', 'Fechamento', '2026-10-22', 2, 'agendada')
       RETURNING id;`,
      [problemId],
    );
    session2Id = sess2.id;

    ownerToken = signAccessToken(app, ownerTutorId, 'carlos@uefs.br', UserType.TUTOR);
    coTutorToken = signAccessToken(app, coTutorId, 'maria@uefs.br', UserType.TUTOR);
    otherTutorToken = signAccessToken(app, otherTutorId, 'ana@uefs.br', UserType.TUTOR);
    student1Token = signAccessToken(app, student1Id, 'lucas@discente.uefs.br', UserType.STUDENT);
  });

  const assignRoleHelper = (
    targetSessionId = sessionId,
    targetStudentId = student1Id,
    payload: object = { papel: 'COORDENADOR', notaAdicional: 0.5 },
    token = ownerToken,
  ) => {
    return server()
      .put(`/api/sessoes/${targetSessionId}/papeis/${targetStudentId}`)
      .set('Authorization', `Bearer ${token}`)
      .send(payload);
  };

  const listRolesHelper = (targetSessionId = sessionId, token = ownerToken) => {
    return server()
      .get(`/api/sessoes/${targetSessionId}/papeis`)
      .set('Authorization', `Bearer ${token}`);
  };

  describe('Authorization matrix for session roles', () => {
    describe('GET /api/sessoes/:sessionId/papeis', () => {
      it('returns 401 Unauthorized when request lacks authorization token', async () => {
        const response = await server().get(`/api/sessoes/${sessionId}/papeis`);
        expect(response.status).toBe(401);
      });

      it('returns 403 Forbidden when student attempts to list session roles', async () => {
        const response = await listRolesHelper(sessionId, student1Token);
        expect(response.status).toBe(403);
      });

      it('returns 403 Forbidden when tutor without access to the room attempts to list session roles', async () => {
        const response = await listRolesHelper(sessionId, otherTutorToken);
        expect(response.status).toBe(403);
      });

      it('returns 200 OK when room owner lists session roles', async () => {
        const response = await listRolesHelper(sessionId, ownerToken);
        expect(response.status).toBe(200);
      });

      it('returns 200 OK when co-tutor lists session roles', async () => {
        const response = await listRolesHelper(sessionId, coTutorToken);
        expect(response.status).toBe(200);
      });
    });

    describe('PUT /api/sessoes/:sessionId/papeis/:studentId', () => {
      it('returns 401 Unauthorized when request lacks authorization token', async () => {
        const response = await server()
          .put(`/api/sessoes/${sessionId}/papeis/${student1Id}`)
          .send({ papel: 'COORDENADOR', notaAdicional: 0.5 });

        expect(response.status).toBe(401);
      });

      it('returns 403 Forbidden when student attempts to assign a session role', async () => {
        const response = await assignRoleHelper(
          sessionId,
          student1Id,
          { papel: 'COORDENADOR' },
          student1Token,
        );
        expect(response.status).toBe(403);
      });

      it('returns 403 Forbidden when tutor without access attempts to assign a session role', async () => {
        const response = await assignRoleHelper(
          sessionId,
          student1Id,
          { papel: 'COORDENADOR' },
          otherTutorToken,
        );
        expect(response.status).toBe(403);
      });

      it('returns 200 OK when room owner assigns a session role', async () => {
        const response = await assignRoleHelper(
          sessionId,
          student1Id,
          { papel: 'COORDENADOR' },
          ownerToken,
        );
        expect(response.status).toBe(200);
      });

      it('returns 200 OK when co-tutor assigns a session role', async () => {
        const response = await assignRoleHelper(
          sessionId,
          student2Id,
          { papel: 'SECRETARIO_MESA' },
          coTutorToken,
        );
        expect(response.status).toBe(200);
      });
    });
  });

  describe('GET /api/sessoes/:sessionId/papeis', () => {
    it('returns empty array when no roles are assigned in the session', async () => {
      const response = await listRolesHelper(sessionId);
      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it('returns list of assigned roles with student name, role and additional score', async () => {
      await assignRoleHelper(sessionId, student1Id, { papel: 'COORDENADOR', notaAdicional: 0.5 });
      await assignRoleHelper(sessionId, student2Id, {
        papel: 'SECRETARIO_QUADRO',
        notaAdicional: 0.25,
      });

      const response = await listRolesHelper(sessionId);
      expect(response.status).toBe(200);
      const roles = response.body as SessionRoleResponseBody[];
      expect(roles).toHaveLength(2);

      const coord = roles.find((r) => r.alunoId === student1Id);
      expect(coord).toMatchObject({
        alunoId: student1Id,
        nome: 'Lucas Aluno Um',
        papel: 'COORDENADOR',
        notaAdicional: 0.5,
      });

      const boardSec = roles.find((r) => r.alunoId === student2Id);
      expect(boardSec).toMatchObject({
        alunoId: student2Id,
        nome: 'Beatriz Aluna Dois',
        papel: 'SECRETARIO_QUADRO',
        notaAdicional: 0.25,
      });
    });

    it('returns 404 Not Found when session does not exist', async () => {
      const nonExistentSessionId = '00000000-0000-0000-0000-000000000000';
      const response = await listRolesHelper(nonExistentSessionId);
      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/sessoes/:sessionId/papeis/:studentId', () => {
    it('assigns role with bonus score successfully', async () => {
      const response = await assignRoleHelper(sessionId, student1Id, {
        papel: 'COORDENADOR',
        notaAdicional: 0.75,
      });

      expect(response.status).toBe(200);
      const body = response.body as AssignedSessionRoleResponseBody;
      expect(body).toEqual({
        alunoId: student1Id,
        papel: 'COORDENADOR',
        notaAdicional: 0.75,
      });
    });

    it('assigns role with null bonus score', async () => {
      const response = await assignRoleHelper(sessionId, student1Id, {
        papel: 'SECRETARIO_MESA',
        notaAdicional: null,
      });

      expect(response.status).toBe(200);
      const body = response.body as AssignedSessionRoleResponseBody;
      expect(body).toEqual({
        alunoId: student1Id,
        papel: 'SECRETARIO_MESA',
        notaAdicional: null,
      });
    });

    it('assigns role without specifying notaAdicional (defaults to null)', async () => {
      const response = await assignRoleHelper(sessionId, student1Id, {
        papel: 'SECRETARIO_QUADRO',
      });

      expect(response.status).toBe(200);
      const body = response.body as AssignedSessionRoleResponseBody;
      expect(body).toEqual({
        alunoId: student1Id,
        papel: 'SECRETARIO_QUADRO',
        notaAdicional: null,
      });
    });

    it('allows boundary values for bonus score (0 and 1)', async () => {
      const resZero = await assignRoleHelper(sessionId, student1Id, {
        papel: 'COORDENADOR',
        notaAdicional: 0,
      });
      expect(resZero.status).toBe(200);
      expect((resZero.body as AssignedSessionRoleResponseBody).notaAdicional).toBe(0);

      const resOne = await assignRoleHelper(sessionId, student1Id, {
        papel: 'COORDENADOR',
        notaAdicional: 1,
      });
      expect(resOne.status).toBe(200);
      expect((resOne.body as AssignedSessionRoleResponseBody).notaAdicional).toBe(1);
    });

    it('updates existing role and bonus score for the same student in the same session', async () => {
      await assignRoleHelper(sessionId, student1Id, {
        papel: 'COORDENADOR',
        notaAdicional: 0.5,
      });

      const response = await assignRoleHelper(sessionId, student1Id, {
        papel: 'SECRETARIO_MESA',
        notaAdicional: 0.8,
      });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        alunoId: student1Id,
        papel: 'SECRETARIO_MESA',
        notaAdicional: 0.8,
      });

      // Garantir que o aluno só tem 1 papel registrado na sessão
      const listRes = await listRolesHelper(sessionId);
      const roles = listRes.body as SessionRoleResponseBody[];
      expect(roles).toHaveLength(1);
      expect(roles[0]?.papel).toBe('SECRETARIO_MESA');
    });

    it('removes role when sending papel: null', async () => {
      await assignRoleHelper(sessionId, student1Id, {
        papel: 'COORDENADOR',
        notaAdicional: 0.5,
      });

      const response = await assignRoleHelper(sessionId, student1Id, {
        papel: null,
      });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        alunoId: student1Id,
        papel: null,
        notaAdicional: null,
      });

      const listRes = await listRolesHelper(sessionId);
      expect(listRes.body).toEqual([]);
    });

    it('returns 422 Unprocessable Entity when student is not enrolled in the room', async () => {
      const response = await assignRoleHelper(sessionId, unenrolledStudentId, {
        papel: 'COORDENADOR',
        notaAdicional: 0.5,
      });

      expect(response.status).toBe(422);
      expect((response.body as { message?: string }).message).toBe(
        'O aluno não está matriculado na sala.',
      );
    });

    it('returns 409 Conflict with ocupadoPor details when role is already occupied without transfer', async () => {
      // Aluno 1 ocupa COORDENADOR
      await assignRoleHelper(sessionId, student1Id, {
        papel: 'COORDENADOR',
        notaAdicional: 0.5,
      });

      // Aluno 2 tenta assumir COORDENADOR sem transferir
      const response = await assignRoleHelper(sessionId, student2Id, {
        papel: 'COORDENADOR',
        notaAdicional: 0.7,
        transferir: false,
      });

      expect(response.status).toBe(409);
      const body = response.body as ConflictErrorResponseBody;
      expect(body.message).toBe('O papel já está ocupado.');
      expect(body.ocupadoPor).toEqual({
        studentId: student1Id,
        name: 'Lucas Aluno Um',
      });
    });

    it('transfers role successfully when transferir: true is provided', async () => {
      // Aluno 1 ocupa COORDENADOR
      await assignRoleHelper(sessionId, student1Id, {
        papel: 'COORDENADOR',
        notaAdicional: 0.5,
      });

      // Aluno 2 assume COORDENADOR com transferir: true
      const response = await assignRoleHelper(sessionId, student2Id, {
        papel: 'COORDENADOR',
        notaAdicional: 0.75,
        transferir: true,
      });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        alunoId: student2Id,
        papel: 'COORDENADOR',
        notaAdicional: 0.75,
      });

      // Verificar que apenas Aluno 2 é COORDENADOR e Aluno 1 foi desvinculado
      const listRes = await listRolesHelper(sessionId);
      const roles = listRes.body as SessionRoleResponseBody[];
      expect(roles).toHaveLength(1);
      expect(roles[0]).toMatchObject({
        alunoId: student2Id,
        nome: 'Beatriz Aluna Dois',
        papel: 'COORDENADOR',
        notaAdicional: 0.75,
      });
    });

    it('returns 400 Bad Request when bonus score is greater than 1', async () => {
      const response = await assignRoleHelper(sessionId, student1Id, {
        papel: 'COORDENADOR',
        notaAdicional: 1.01,
      });

      expect(response.status).toBe(400);
    });

    it('returns 400 Bad Request when bonus score is negative', async () => {
      const response = await assignRoleHelper(sessionId, student1Id, {
        papel: 'COORDENADOR',
        notaAdicional: -0.1,
      });

      expect(response.status).toBe(400);
    });

    it('returns 400 Bad Request when bonus score has more than 2 decimal places', async () => {
      const response = await assignRoleHelper(sessionId, student1Id, {
        papel: 'COORDENADOR',
        notaAdicional: 0.123,
      });

      expect(response.status).toBe(400);
    });

    it('returns 400 Bad Request when role is invalid string', async () => {
      const response = await assignRoleHelper(sessionId, student1Id, {
        papel: 'PRESIDENTE',
        notaAdicional: 0.5,
      });

      expect(response.status).toBe(400);
    });

    it('returns 404 Not Found when session does not exist', async () => {
      const nonExistentSessionId = '00000000-0000-0000-0000-000000000000';
      const response = await assignRoleHelper(nonExistentSessionId, student1Id, {
        papel: 'COORDENADOR',
      });

      expect(response.status).toBe(404);
    });
  });

  describe('Multi-session role isolation and Cascade deletion', () => {
    it('maintains independent roles across different sessions', async () => {
      await assignRoleHelper(sessionId, student1Id, {
        papel: 'COORDENADOR',
        notaAdicional: 0.5,
      });

      await assignRoleHelper(session2Id, student2Id, {
        papel: 'COORDENADOR',
        notaAdicional: 0.7,
      });

      const list1 = await listRolesHelper(sessionId);
      const list2 = await listRolesHelper(session2Id);

      const roles1 = list1.body as SessionRoleResponseBody[];
      const roles2 = list2.body as SessionRoleResponseBody[];

      expect(roles1).toHaveLength(1);
      expect(roles1[0]?.alunoId).toBe(student1Id);

      expect(roles2).toHaveLength(1);
      expect(roles2[0]?.alunoId).toBe(student2Id);
    });

    it('cascades deletion of session_roles when session is deleted', async () => {
      await assignRoleHelper(sessionId, student1Id, {
        papel: 'COORDENADOR',
        notaAdicional: 0.5,
      });

      const rolesBefore = await dataSource.query<Array<Record<string, unknown>>>(
        `SELECT * FROM session_roles WHERE session_id = $1;`,
        [sessionId],
      );
      expect(rolesBefore).toHaveLength(1);

      await dataSource.query(`DELETE FROM sessions WHERE id = $1;`, [sessionId]);

      const rolesAfter = await dataSource.query<Array<Record<string, unknown>>>(
        `SELECT * FROM session_roles WHERE session_id = $1;`,
        [sessionId],
      );
      expect(rolesAfter).toHaveLength(0);
    });
  });
});
