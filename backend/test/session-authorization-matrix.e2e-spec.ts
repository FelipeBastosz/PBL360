import type { Server } from 'node:http';
import { type INestApplication } from '@nestjs/common';
import { type TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { DataSource } from 'typeorm';

import { UserType } from '@/users/domain/enums/user-type.enum';
import { createTestApp } from './helpers/create-test-app';
import { cleanDatabase, signAccessToken } from './helpers/fixtures';

describe('Session Authorization Matrix (e2e)', () => {
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
  let problemId: string;
  let sessionId: string;
  let criterionId: string;

  const server = () => request(app.getHttpServer() as Server);

  beforeAll(async () => {
    let moduleRef: TestingModule;
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
       VALUES ('Carlos Professor', 'carlos.matrix@uefs.br', 'hash', $1, true)
       RETURNING id;`,
      [UserType.TUTOR],
    );
    ownerTutorId = owner.id;

    const [coTutor] = await dataSource.query<[{ id: string }]>(
      `INSERT INTO users (name, email, password_hash, type, active)
       VALUES ('Maria Co-tutora', 'maria.matrix@uefs.br', 'hash', $1, true)
       RETURNING id;`,
      [UserType.TUTOR],
    );
    coTutorId = coTutor.id;

    const [otherTutor] = await dataSource.query<[{ id: string }]>(
      `INSERT INTO users (name, email, password_hash, type, active)
       VALUES ('Joaquim Outro', 'joaquim.matrix@uefs.br', 'hash', $1, true)
       RETURNING id;`,
      [UserType.TUTOR],
    );
    otherTutorId = otherTutor.id;

    const [student] = await dataSource.query<[{ id: string }]>(
      `INSERT INTO users (name, email, password_hash, type, registration_number, active)
       VALUES ('Ana Estudante', 'ana.matrix@discente.uefs.br', 'hash', $1, '20261001', true)
       RETURNING id;`,
      [UserType.STUDENT],
    );
    studentId = student.id;

    ownerToken = signAccessToken(app, ownerTutorId, 'carlos.matrix@uefs.br', UserType.TUTOR);
    coTutorToken = signAccessToken(app, coTutorId, 'maria.matrix@uefs.br', UserType.TUTOR);
    otherTutorToken = signAccessToken(app, otherTutorId, 'joaquim.matrix@uefs.br', UserType.TUTOR);
    studentToken = signAccessToken(app, studentId, 'ana.matrix@discente.uefs.br', UserType.STUDENT);

    const [room] = await dataSource.query<[{ id: string }]>(
      `INSERT INTO rooms (tutor_id, name, course_code, room_code, semester, active)
       VALUES ($1, 'Engenharia de Software', 'EXA123', 'ROOMMAT1', '2026.2', true)
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

    const [perfTable] = await dataSource.query<[{ id: string }]>(
      `INSERT INTO performance_tables (tutor_id, name, is_default)
       VALUES ($1, 'Barema Matriz', false)
       RETURNING id;`,
      [ownerTutorId],
    );

    const [criterion] = await dataSource.query<[{ id: string }]>(
      `INSERT INTO performance_criteria (performance_table_id, name, order_index, weight)
       VALUES ($1, 'Participação', 1, 1)
       RETURNING id;`,
      [perfTable.id],
    );
    criterionId = criterion.id;

    const [problem] = await dataSource.query<[{ id: string }]>(
      `INSERT INTO problems (room_id, title, description, order_index, created_by)
       VALUES ($1, 'Problema Matriz', 'Descrição', 1, $2)
       RETURNING id;`,
      [roomId, ownerTutorId],
    );
    problemId = problem.id;

    const [session] = await dataSource.query<[{ id: string }]>(
      `INSERT INTO sessions (problem_id, performance_table_id, title, description, date, order_index, status)
       VALUES ($1, $2, 'Sessão 1', 'Descrição', '2026-10-02', 1, 'agendada')
       RETURNING id;`,
      [problemId, perfTable.id],
    );
    sessionId = session.id;
  });

  describe('1. Chamada (Roll Call)', () => {
    const path = () => `/api/sessoes/${sessionId}/chamada`;

    it('allows room owner to get roll call', async () => {
      await server().get(path()).set('Authorization', `Bearer ${ownerToken}`).expect(200);
    });

    it('allows co-tutor to get roll call', async () => {
      await server().get(path()).set('Authorization', `Bearer ${coTutorToken}`).expect(200);
    });

    it('blocks tutor from another room with 403', async () => {
      await server().get(path()).set('Authorization', `Bearer ${otherTutorToken}`).expect(403);
    });

    it('blocks student with 403', async () => {
      await server().get(path()).set('Authorization', `Bearer ${studentToken}`).expect(403);
    });

    it('blocks unauthenticated request with 401', async () => {
      await server().get(path()).expect(401);
    });
  });

  describe('2. Papéis da Sessão (Session Roles)', () => {
    const listPath = () => `/api/sessoes/${sessionId}/papeis`;
    const assignPath = () => `/api/sessoes/${sessionId}/papeis/${studentId}`;

    it('allows room owner to list roles', async () => {
      await server().get(listPath()).set('Authorization', `Bearer ${ownerToken}`).expect(200);
    });

    it('allows co-tutor to assign role', async () => {
      await server()
        .put(assignPath())
        .set('Authorization', `Bearer ${coTutorToken}`)
        .send({ papel: 'COORDENADOR', notaAdicional: 0.5 })
        .expect(200);
    });

    it('blocks tutor from another room with 403', async () => {
      await server().get(listPath()).set('Authorization', `Bearer ${otherTutorToken}`).expect(403);
    });

    it('blocks student with 403', async () => {
      await server()
        .put(assignPath())
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ papel: 'COORDENADOR' })
        .expect(403);
    });

    it('blocks unauthenticated request with 401', async () => {
      await server().get(listPath()).expect(401);
    });
  });

  describe('3. Observações (Observations)', () => {
    const listPath = () => `/api/sessoes/${sessionId}/alunos/${studentId}/observacoes`;

    it('allows room owner to list student observations', async () => {
      await server().get(listPath()).set('Authorization', `Bearer ${ownerToken}`).expect(200);
    });

    it('allows co-tutor to create student observation', async () => {
      await server()
        .post(listPath())
        .set('Authorization', `Bearer ${coTutorToken}`)
        .send({ texto: 'Excelente postura colaborativa' })
        .expect(201);
    });

    it('blocks tutor from another room with 403', async () => {
      await server().get(listPath()).set('Authorization', `Bearer ${otherTutorToken}`).expect(403);
    });

    it('blocks student with 403', async () => {
      await server()
        .post(listPath())
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ texto: 'Texto' })
        .expect(403);
    });

    it('blocks unauthenticated request with 401', async () => {
      await server().get(listPath()).expect(401);
    });
  });

  describe('4. Avaliações (Tutor Evaluations)', () => {
    const listPath = () => `/api/sessoes/${sessionId}/avaliacoes`;
    const evalPath = () => `/api/sessoes/${sessionId}/avaliacoes/${studentId}`;

    it('allows room owner to list evaluations', async () => {
      await server().get(listPath()).set('Authorization', `Bearer ${ownerToken}`).expect(200);
    });

    it('allows co-tutor to save tutor evaluation', async () => {
      await server()
        .put(evalPath())
        .set('Authorization', `Bearer ${coTutorToken}`)
        .send({
          itens: [{ criterioId: criterionId, nota: 8.5 }],
          enviar: false,
        })
        .expect(200);
    });

    it('blocks tutor from another room with 403', async () => {
      await server().get(listPath()).set('Authorization', `Bearer ${otherTutorToken}`).expect(403);
    });

    it('blocks student with 403', async () => {
      await server()
        .put(evalPath())
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ itens: [] })
        .expect(403);
    });

    it('blocks unauthenticated request with 401', async () => {
      await server().get(listPath()).expect(401);
    });
  });

  describe('5. Configuração de avaliação da sessão', () => {
    const path = () => `/api/sessoes/${sessionId}/configuracao-avaliacao`;

    it('allows room owner to get session evaluation configuration', async () => {
      await server().get(path()).set('Authorization', `Bearer ${ownerToken}`).expect(200);
    });

    it('allows co-tutor to get session evaluation configuration', async () => {
      await server().get(path()).set('Authorization', `Bearer ${coTutorToken}`).expect(200);
    });

    it('blocks tutor from another room with 403', async () => {
      await server().get(path()).set('Authorization', `Bearer ${otherTutorToken}`).expect(403);
    });

    it('blocks student with 403', async () => {
      await server().get(path()).set('Authorization', `Bearer ${studentToken}`).expect(403);
    });

    it('blocks unauthenticated request with 401', async () => {
      await server().get(path()).expect(401);
    });
  });

  describe('6. Notas (Problem Grades)', () => {
    const path = () => `/api/salas/${roomId}/problemas/${problemId}/notas`;

    it('allows room owner to get grades', async () => {
      await server().get(path()).set('Authorization', `Bearer ${ownerToken}`).expect(200);
    });

    it('allows co-tutor to get grades', async () => {
      await server().get(path()).set('Authorization', `Bearer ${coTutorToken}`).expect(200);
    });

    it('blocks tutor from another room with 403', async () => {
      await server().get(path()).set('Authorization', `Bearer ${otherTutorToken}`).expect(403);
    });

    it('blocks student with 403', async () => {
      await server().get(path()).set('Authorization', `Bearer ${studentToken}`).expect(403);
    });

    it('blocks unauthenticated request with 401', async () => {
      await server().get(path()).expect(401);
    });
  });

  describe('7. Feedbacks da Sessão (Session Feedbacks)', () => {
    const path = () => `/api/sessoes/${sessionId}/alunos/${studentId}/feedback`;

    it('allows room owner to get session feedback', async () => {
      await server().get(path()).set('Authorization', `Bearer ${ownerToken}`).expect(200);
    });

    it('allows co-tutor to save session feedback', async () => {
      await server()
        .put(path())
        .set('Authorization', `Bearer ${coTutorToken}`)
        .send({ texto: 'Ótima participação e liderança na sessão.' })
        .expect(200);
    });

    it('blocks tutor from another room with 403', async () => {
      await server().get(path()).set('Authorization', `Bearer ${otherTutorToken}`).expect(403);
    });

    it('blocks student with 403', async () => {
      await server().get(path()).set('Authorization', `Bearer ${studentToken}`).expect(403);
    });

    it('blocks unauthenticated request with 401', async () => {
      await server().get(path()).expect(401);
    });
  });
});
