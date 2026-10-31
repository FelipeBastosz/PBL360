import type { Server } from 'node:http';
import { type INestApplication } from '@nestjs/common';
import { type TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { DataSource } from 'typeorm';

import { UserType } from '@/users/domain/enums/user-type.enum';
import { createTestApp } from './helpers/create-test-app';
import { cleanDatabase, insertDefaultPerformanceTable, signAccessToken } from './helpers/fixtures';

interface ProblemFormulaResponseBody {
  escopo: string;
  padrao: boolean;
  versao: number | null;
  componentes: Array<{
    tipo: string;
    referenciaId: string | null;
    nome: string | null;
    peso: number;
  }>;
}

interface SessionFormulaResponseBody {
  padrao: boolean;
  versao: number | null;
  componentes: Array<{
    tipo: string;
    peso: number;
  }>;
}

interface ErrorResponseBody {
  message: string;
}

describe('Formula Retrieval Authorization (e2e)', () => {
  let moduleRef: TestingModule;
  let app: INestApplication;
  let dataSource: DataSource;

  let ownerTutorId: string;
  let coTutorId: string;
  let unrelatedTutorId: string;

  let ownerToken: string;
  let coTutorToken: string;
  let unrelatedTutorToken: string;

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
       VALUES ('Carlos Professor', 'carlos.formula@uefs.br', 'hash', '${UserType.TUTOR}', true)
       RETURNING id;`,
    );
    ownerTutorId = owner.id;

    const [coTutor] = await dataSource.query<[{ id: string }]>(
      `INSERT INTO users (name, email, password_hash, type, active)
       VALUES ('Maria Co-tutora', 'maria.formula@uefs.br', 'hash', '${UserType.TUTOR}', true)
       RETURNING id;`,
    );
    coTutorId = coTutor.id;

    const [unrelatedTutor] = await dataSource.query<[{ id: string }]>(
      `INSERT INTO users (name, email, password_hash, type, active)
       VALUES ('Joaquim Outro', 'joaquim.formula@uefs.br', 'hash', '${UserType.TUTOR}', true)
       RETURNING id;`,
    );
    unrelatedTutorId = unrelatedTutor.id;

    ownerToken = signAccessToken(app, ownerTutorId, 'carlos.formula@uefs.br', UserType.TUTOR);
    coTutorToken = signAccessToken(app, coTutorId, 'maria.formula@uefs.br', UserType.TUTOR);
    unrelatedTutorToken = signAccessToken(
      app,
      unrelatedTutorId,
      'joaquim.formula@uefs.br',
      UserType.TUTOR,
    );

    await insertDefaultPerformanceTable(dataSource, ownerTutorId);

    const [room] = await dataSource.query<[{ id: string }]>(
      `INSERT INTO rooms (tutor_id, name, course_code, room_code, semester, active)
       VALUES ($1, 'Engenharia de Software', 'EXA123', 'ROOMFORM1', '2026.2', true)
       RETURNING id;`,
      [ownerTutorId],
    );
    roomId = room.id;

    // Link co-tutor to the class (sala)
    await dataSource.query(`INSERT INTO room_tutors (room_id, tutor_id) VALUES ($1, $2);`, [
      roomId,
      coTutorId,
    ]);

    // Problem created by owner
    const [problem] = await dataSource.query<[{ id: string }]>(
      `INSERT INTO problems (room_id, title, description, order_index, created_by)
       VALUES ($1, 'Problema 1', 'Descrição do problema', 1, $2)
       RETURNING id;`,
      [roomId, ownerTutorId],
    );
    problemId = problem.id;

    // Session created by owner (DB trigger creates default session formula created_by = ownerTutorId)
    const [session] = await dataSource.query<[{ id: string }]>(
      `INSERT INTO sessions (problem_id, title, date, order_index)
       VALUES ($1, 'Sessão 1', '2026-10-15', 1)
       RETURNING id;`,
      [problemId],
    );
    sessionId = session.id;
  });

  describe('GET /salas/:salaId/problemas/:problemaId/formula', () => {
    it('Success (200 OK): A co-tutor (who did not create the formula) requests the problem formula and receives the data', async () => {
      const response = await server()
        .get(`/api/salas/${roomId}/problemas/${problemId}/formula`)
        .set('Authorization', `Bearer ${coTutorToken}`)
        .expect(200);

      const body = response.body as ProblemFormulaResponseBody;
      expect(body).toMatchObject({
        escopo: 'PROBLEMA',
        padrao: true,
        versao: null,
      });
      expect(body.componentes).toEqual([
        {
          tipo: 'MEDIA_SESSOES',
          referenciaId: null,
          nome: 'Média das Sessões',
          peso: 100,
        },
      ]);
    });

    it('Success (200 OK): A co-tutor receives customized problem formula created by the owner', async () => {
      // Owner customizes the formula
      await server()
        .put(`/api/salas/${roomId}/problemas/${problemId}/formula`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          escopo: 'PROBLEMA',
          componentes: [{ tipo: 'MEDIA_SESSOES', peso: 100 }],
        })
        .expect(200);

      // Co-tutor queries the customized formula
      const response = await server()
        .get(`/api/salas/${roomId}/problemas/${problemId}/formula`)
        .set('Authorization', `Bearer ${coTutorToken}`)
        .expect(200);

      const body = response.body as ProblemFormulaResponseBody;
      expect(body).toMatchObject({
        escopo: 'PROBLEMA',
        padrao: false,
        versao: 1,
      });
      expect(body.componentes).toEqual([
        {
          tipo: 'MEDIA_SESSOES',
          referenciaId: null,
          nome: 'Média das Sessões',
          peso: 100,
        },
      ]);
    });

    it('Failure (403 Forbidden): A user with no relation to the class (sala) attempts to fetch the formula and is blocked', async () => {
      const response = await server()
        .get(`/api/salas/${roomId}/problemas/${problemId}/formula`)
        .set('Authorization', `Bearer ${unrelatedTutorToken}`)
        .expect(403);

      const body = response.body as ErrorResponseBody;
      expect(body.message).toMatch(/Você não tem permissão para acessar ou modificar esta sala/i);
    });
  });

  describe('GET /sessoes/:sessaoId/formula', () => {
    it('Success (200 OK): A co-tutor (who did not create the formula) requests the session formula and receives the data', async () => {
      const response = await server()
        .get(`/api/sessoes/${sessionId}/formula`)
        .set('Authorization', `Bearer ${coTutorToken}`)
        .expect(200);

      const body = response.body as SessionFormulaResponseBody;
      expect(body).toMatchObject({
        padrao: true,
        versao: null,
      });
      expect(body.componentes).toEqual([
        { tipo: 'CRITERIOS', peso: 70 },
        { tipo: 'PAPEL', peso: 30 },
      ]);
    });

    it('Success (200 OK): A co-tutor receives customized session formula created by the owner', async () => {
      // Owner customizes session formula to 60/40
      await server()
        .put(`/api/sessoes/${sessionId}/formula`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          componentes: [
            { tipo: 'CRITERIOS', peso: 60 },
            { tipo: 'PAPEL', peso: 40 },
          ],
        })
        .expect(200);

      // Co-tutor queries the customized session formula
      const response = await server()
        .get(`/api/sessoes/${sessionId}/formula`)
        .set('Authorization', `Bearer ${coTutorToken}`)
        .expect(200);

      const body = response.body as SessionFormulaResponseBody;
      expect(body).toMatchObject({
        padrao: false,
        versao: 2,
      });
      expect(body.componentes).toEqual([
        { tipo: 'CRITERIOS', peso: 60 },
        { tipo: 'PAPEL', peso: 40 },
      ]);
    });

    it('Failure (403 Forbidden): A user with no relation to the class (sala) attempts to fetch the formula and is blocked', async () => {
      const response = await server()
        .get(`/api/sessoes/${sessionId}/formula`)
        .set('Authorization', `Bearer ${unrelatedTutorToken}`)
        .expect(403);

      const body = response.body as ErrorResponseBody;
      expect(body.message).toMatch(/Você não tem permissão para acessar ou modificar esta sala/i);
    });
  });
});
