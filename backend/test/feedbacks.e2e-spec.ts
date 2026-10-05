import type { Server } from 'node:http';
import { type INestApplication } from '@nestjs/common';
import { type TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { DataSource } from 'typeorm';

import { UserType } from '@/users/domain/enums/user-type.enum';
import { createTestApp } from './helpers/create-test-app';
import { cleanDatabase, signAccessToken } from './helpers/fixtures';

interface StudentFeedbackResponse {
  id: string;
  escopo: string;
  destinatarioId: string;
  nota: number | null;
  texto: string;
}

interface GeneralFeedbackResponse {
  id: string;
  escopo: string;
  texto: string;
}

interface ProblemFeedbacksResponse {
  geral: GeneralFeedbackResponse | null;
  alunos: StudentFeedbackResponse[];
}

interface FeedbackRevisionResponse {
  nota: number | null;
  texto: string;
  editadoPor: string;
  editadoEm: string;
}

describe('Feedbacks (e2e)', () => {
  let moduleRef: TestingModule;
  let app: INestApplication;
  let dataSource: DataSource;

  let ownerTutorId: string;
  let coTutorId: string;
  let otherTutorId: string;
  let student1Id: string;

  let ownerToken: string;
  let coTutorToken: string;
  let otherTutorToken: string;
  let student1Token: string;

  let roomId: string;
  let problemId: string;
  let sessionId: string;

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
       VALUES ('Outro Tutor', 'outro@uefs.br', 'hash', '${UserType.TUTOR}', true)
       RETURNING id;`,
    );
    otherTutorId = otherTutor.id;

    const [student] = await dataSource.query<[{ id: string }]>(
      `INSERT INTO users (name, email, password_hash, type, registration_number, active)
       VALUES ('Lucas Aluno', 'lucas@discente.uefs.br', 'hash', '${UserType.STUDENT}', '20260001', true)
       RETURNING id;`,
    );
    student1Id = student.id;

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

    const [problem] = await dataSource.query<[{ id: string }]>(
      `INSERT INTO problems (room_id, title, description, order_index, created_by)
       VALUES ($1, 'Problema 1', 'Descrição do problema', 1, $2)
       RETURNING id;`,
      [roomId, ownerTutorId],
    );
    problemId = problem.id;

    const [session] = await dataSource.query<[{ id: string }]>(
      `INSERT INTO sessions (problem_id, title, description, date, order_index, status)
       VALUES ($1, 'Sessão 1', 'Abertura', '2026-10-15', 1, 'agendada')
       RETURNING id;`,
      [problemId],
    );
    sessionId = session.id;

    ownerToken = signAccessToken(app, ownerTutorId, 'carlos@uefs.br', UserType.TUTOR);
    coTutorToken = signAccessToken(app, coTutorId, 'maria@uefs.br', UserType.TUTOR);
    otherTutorToken = signAccessToken(app, otherTutorId, 'outro@uefs.br', UserType.TUTOR);
    student1Token = signAccessToken(app, student1Id, 'lucas@discente.uefs.br', UserType.STUDENT);
  });

  describe('Authorization Matrix for Problem Feedbacks', () => {
    it('allows owner tutor to save student and general problem feedback and view them', async () => {
      const studentRes = await server()
        .put(`/api/salas/${roomId}/problemas/${problemId}/feedbacks/alunos/${student1Id}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ nota: 9.0, texto: 'Ótima participação e fundamentação.' })
        .expect(200);

      const studentBody = studentRes.body as StudentFeedbackResponse;
      expect(studentBody).toMatchObject({
        escopo: 'ALUNO',
        destinatarioId: student1Id,
        nota: 9,
        texto: 'Ótima participação e fundamentação.',
      });

      const generalRes = await server()
        .put(`/api/salas/${roomId}/problemas/${problemId}/feedbacks/geral`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ texto: 'Excelente discussão da turma sobre a arquitetura.' })
        .expect(200);

      const generalBody = generalRes.body as GeneralFeedbackResponse;
      expect(generalBody).toMatchObject({
        escopo: 'PROBLEMA',
        texto: 'Excelente discussão da turma sobre a arquitetura.',
      });

      const listRes = await server()
        .get(`/api/salas/${roomId}/problemas/${problemId}/feedbacks`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      const listBody = listRes.body as ProblemFeedbacksResponse;
      expect(listBody.geral).toMatchObject({ escopo: 'PROBLEMA' });
      expect(listBody.alunos).toHaveLength(1);
    });

    it('allows co-tutor to update student feedback and creates a revision history', async () => {
      const initial = await server()
        .put(`/api/salas/${roomId}/problemas/${problemId}/feedbacks/alunos/${student1Id}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ nota: 8.0, texto: 'Feedback inicial do tutor responsável.' })
        .expect(200);

      const initialBody = initial.body as StudentFeedbackResponse;

      const updated = await server()
        .put(`/api/salas/${roomId}/problemas/${problemId}/feedbacks/alunos/${student1Id}`)
        .set('Authorization', `Bearer ${coTutorToken}`)
        .send({ nota: 9.5, texto: 'Revisão e melhoria do feedback pela co-tutora.' })
        .expect(200);

      const updatedBody = updated.body as StudentFeedbackResponse;
      expect(updatedBody.nota).toBe(9.5);

      const revisionsRes = await server()
        .get(`/api/feedbacks/${initialBody.id}/revisoes`)
        .set('Authorization', `Bearer ${coTutorToken}`)
        .expect(200);

      const revisions = revisionsRes.body as FeedbackRevisionResponse[];
      expect(revisions.length).toBeGreaterThanOrEqual(1);
      expect(revisions[0]).toMatchObject({
        texto: 'Feedback inicial do tutor responsável.',
        nota: 8,
        editadoPor: 'Maria Co-tutora',
      });
    });

    it('rejects problem feedback modification by a tutor of another room (403)', async () => {
      await server()
        .put(`/api/salas/${roomId}/problemas/${problemId}/feedbacks/alunos/${student1Id}`)
        .set('Authorization', `Bearer ${otherTutorToken}`)
        .send({ nota: 7.0, texto: 'Tentativa de outro tutor.' })
        .expect(403);

      await server()
        .put(`/api/salas/${roomId}/problemas/${problemId}/feedbacks/geral`)
        .set('Authorization', `Bearer ${otherTutorToken}`)
        .send({ texto: 'Tentativa de outro tutor.' })
        .expect(403);

      await server()
        .get(`/api/salas/${roomId}/problemas/${problemId}/feedbacks`)
        .set('Authorization', `Bearer ${otherTutorToken}`)
        .expect(403);
    });

    it('rejects problem feedback modification and listing by a student (403)', async () => {
      await server()
        .put(`/api/salas/${roomId}/problemas/${problemId}/feedbacks/alunos/${student1Id}`)
        .set('Authorization', `Bearer ${student1Token}`)
        .send({ nota: 10, texto: 'Aluno tentando avaliar.' })
        .expect(403);

      await server()
        .get(`/api/salas/${roomId}/problemas/${problemId}/feedbacks`)
        .set('Authorization', `Bearer ${student1Token}`)
        .expect(403);
    });

    it('rejects unauthenticated requests with 401', async () => {
      await server().get(`/api/salas/${roomId}/problemas/${problemId}/feedbacks`).expect(401);
    });
  });

  describe('Authorization Matrix for Session Feedbacks', () => {
    it('allows owner and co-tutor to save and retrieve session feedback', async () => {
      await server()
        .put(`/api/sessoes/${sessionId}/alunos/${student1Id}/feedback`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ texto: 'Participação ativa na primeira sessão.' })
        .expect(200);

      const getRes = await server()
        .get(`/api/sessoes/${sessionId}/alunos/${student1Id}/feedback`)
        .set('Authorization', `Bearer ${coTutorToken}`)
        .expect(200);

      expect(getRes.body).toMatchObject({
        texto: 'Participação ativa na primeira sessão.',
      });
    });

    it('rejects session feedback by other tutor and student (403)', async () => {
      await server()
        .put(`/api/sessoes/${sessionId}/alunos/${student1Id}/feedback`)
        .set('Authorization', `Bearer ${otherTutorToken}`)
        .send({ texto: 'Tentativa indevida.' })
        .expect(403);

      await server()
        .get(`/api/sessoes/${sessionId}/alunos/${student1Id}/feedback`)
        .set('Authorization', `Bearer ${otherTutorToken}`)
        .expect(403);

      await server()
        .put(`/api/sessoes/${sessionId}/alunos/${student1Id}/feedback`)
        .set('Authorization', `Bearer ${student1Token}`)
        .send({ texto: 'Aluno tentando editar feedback.' })
        .expect(403);

      await server()
        .get(`/api/sessoes/${sessionId}/alunos/${student1Id}/feedback`)
        .set('Authorization', `Bearer ${student1Token}`)
        .expect(403);
    });
  });
});
