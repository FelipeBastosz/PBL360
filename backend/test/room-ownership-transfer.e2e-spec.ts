import type { Server } from 'node:http';
import type { INestApplication } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { UserType } from '@/users/domain/enums/user-type.enum';
import { createTestApp } from './helpers/create-test-app';
import { api, cleanDatabase, insertUser, type TestUser } from './helpers/fixtures';

const MISSING_ID = '00000000-0000-4000-8000-000000000000';
const NEW_ROOM = { nome: 'Engenharia de Software', codigoDisciplina: 'exa123', semestre: '2026.2' };

describe('Room Ownership Transfer (e2e)', () => {
  let app: INestApplication;
  let moduleRef: TestingModule;
  let dataSource: DataSource;
  let owner: TestUser;
  let coTutor: TestUser;
  let otherTutor: TestUser;
  let student: TestUser;

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
    owner = await insertUser(app, dataSource, 'owner@uefs.br');
    coTutor = await insertUser(app, dataSource, 'cotutor@uefs.br');
    otherTutor = await insertUser(app, dataSource, 'other@uefs.br');
    student = await insertUser(app, dataSource, '20240001@discente.uefs.br', UserType.STUDENT);
  });

  const createRoomWithCoTutor = async (): Promise<{
    id: string;
    codigoSala: string;
    professorResponsavelId: string;
  }> => {
    const res = await api(app, owner).post('/salas', NEW_ROOM).expect(201);
    const room = res.body as { id: string; codigoSala: string; professorResponsavelId: string };
    await api(app, owner)
      .post(`/salas/${room.id}/professores`, { professorId: coTutor.id })
      .expect(201);
    return room;
  };

  it('transfers ownership to a linked tutor, updates permissions and records audit log', async () => {
    const room = await createRoomWithCoTutor();

    const transferRes = await api(app, owner)
      .patch(`/salas/${room.id}/proprietario`, { professorId: coTutor.id })
      .expect(200);

    expect(transferRes.body).toEqual({
      id: room.id,
      professorResponsavelId: coTutor.id,
    });

    const detailRes = await api(app, coTutor).get(`/salas/${room.id}`).expect(200);
    expect(detailRes.body).toMatchObject({
      id: room.id,
      professorResponsavelId: coTutor.id,
      codigoSala: room.codigoSala,
    });

    const tutorsRes = await api(app, owner).get(`/salas/${room.id}/professores`).expect(200);
    expect(tutorsRes.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: coTutor.id, responsavel: true }),
        expect.objectContaining({ id: owner.id, responsavel: false }),
      ]),
    );

    // New owner can perform owner-only actions; previous owner becomes co-tutor
    await api(app, coTutor)
      .post(`/salas/${room.id}/professores`, { professorId: otherTutor.id })
      .expect(201);
    await api(app, owner).delete(`/salas/${room.id}/professores/${otherTutor.id}`).expect(403);
    await api(app, coTutor).delete(`/salas/${room.id}/professores/${otherTutor.id}`).expect(200);
    await api(app, owner).patch(`/salas/${room.id}`, { nome: 'Co-tutor edita' }).expect(200);
    await api(app, owner).get(`/salas/${room.id}`).expect(200);
    await api(app, owner).get(`/salas/${room.id}/alunos`).expect(200);

    const audits = await dataSource.query<
      {
        room_id: string;
        previous_owner_id: string;
        new_owner_id: string;
        transferred_by_id: string;
        transferred_at: Date;
      }[]
    >(
      `SELECT room_id, previous_owner_id, new_owner_id, transferred_by_id, transferred_at
       FROM room_ownership_transfers WHERE room_id = $1;`,
      [room.id],
    );
    expect(audits).toHaveLength(1);
    expect(audits[0]).toMatchObject({
      room_id: room.id,
      previous_owner_id: owner.id,
      new_owner_id: coTutor.id,
      transferred_by_id: owner.id,
    });
    expect(audits[0]!.transferred_at).toBeInstanceOf(Date);
  });

  it('blocks unauthorized, invalid, inactive, unlinked and self-transfer requests', async () => {
    const room = await createRoomWithCoTutor();

    // 401 without authentication
    await request(app.getHttpServer() as Server)
      .patch(`/api/salas/${room.id}/proprietario`)
      .send({ professorId: coTutor.id })
      .expect(401);

    // 400 invalid UUID or self-transfer
    await api(app, owner)
      .patch(`/salas/invalid-uuid/proprietario`, { professorId: coTutor.id })
      .expect(400);
    await api(app, owner)
      .patch(`/salas/${room.id}/proprietario`, { professorId: 'invalid-uuid' })
      .expect(400);
    await api(app, owner)
      .patch(`/salas/${room.id}/proprietario`, { professorId: owner.id })
      .expect(400);

    // 403 co-tutor, student, or tutor from another room
    await api(app, coTutor)
      .patch(`/salas/${room.id}/proprietario`, { professorId: owner.id })
      .expect(403);
    await api(app, student)
      .patch(`/salas/${room.id}/proprietario`, { professorId: coTutor.id })
      .expect(403);
    await api(app, otherTutor)
      .patch(`/salas/${room.id}/proprietario`, { professorId: coTutor.id })
      .expect(403);

    // 404 missing room or non-tutor/missing target
    await api(app, owner)
      .patch(`/salas/${MISSING_ID}/proprietario`, { professorId: coTutor.id })
      .expect(404);
    await api(app, owner)
      .patch(`/salas/${room.id}/proprietario`, { professorId: MISSING_ID })
      .expect(404);
    await api(app, owner)
      .patch(`/salas/${room.id}/proprietario`, { professorId: student.id })
      .expect(404);

    // 422 unlinked tutor
    await api(app, owner)
      .patch(`/salas/${room.id}/proprietario`, { professorId: otherTutor.id })
      .expect(422);

    // 422 inactive linked tutor
    await dataSource.query('UPDATE users SET active = FALSE WHERE id = $1;', [coTutor.id]);
    await api(app, owner)
      .patch(`/salas/${room.id}/proprietario`, { professorId: coTutor.id })
      .expect(422);
  });

  it('preserves room code, students, problems, sessions, tables, grades and feedback authorship', async () => {
    const room = await createRoomWithCoTutor();
    await api(app, student)
      .post('/salas/ingressar/codigo', { codigoSala: room.codigoSala })
      .expect(200);

    const [table] = await dataSource.query<[{ id: string }]>(
      `INSERT INTO performance_tables (tutor_id, room_id, name, is_default)
       VALUES ($1, $2, 'Tabela Turma', FALSE) RETURNING id;`,
      [owner.id, room.id],
    );
    const [problem] = await dataSource.query<[{ id: string }]>(
      `INSERT INTO problems (room_id, title, description, order_index, created_by)
       VALUES ($1, 'Problema 1', 'Desc', 1, $2) RETURNING id;`,
      [room.id, owner.id],
    );
    const [session] = await dataSource.query<[{ id: string }]>(
      `INSERT INTO sessions (problem_id, performance_table_id, title, date, order_index)
       VALUES ($1, $2, 'Sessão 1', '2026-10-10', 1) RETURNING id;`,
      [problem.id, table.id],
    );
    const [feedback] = await dataSource.query<[{ id: string; autor_id: string }]>(
      `INSERT INTO feedback (autor_id, problema_id, sessao_id, destinatario_id, escopo, texto)
       VALUES ($1, $2, $3, $4, 'SESSAO', 'Feedback original') RETURNING id, autor_id;`,
      [owner.id, problem.id, session.id, student.id],
    );
    await dataSource.query(
      `INSERT INTO session_grades (session_id, student_id, grade, situation, formula_version)
       VALUES ($1, $2, 9.5, 'APROVADO', 1);`,
      [session.id, student.id],
    );

    await api(app, owner)
      .patch(`/salas/${room.id}/proprietario`, { professorId: coTutor.id })
      .expect(200);

    const [persistedRoom] = await dataSource.query<[{ room_code: string; tutor_id: string }]>(
      'SELECT room_code, tutor_id FROM rooms WHERE id = $1;',
      [room.id],
    );
    expect(persistedRoom).toEqual({ room_code: room.codigoSala, tutor_id: coTutor.id });

    const [studentCount] = await dataSource.query<[{ count: string }]>(
      'SELECT COUNT(*)::text AS count FROM room_students WHERE room_id = $1 AND student_id = $2;',
      [room.id, student.id],
    );
    expect(Number(studentCount.count)).toBe(1);

    const [persistedTable] = await dataSource.query<[{ tutor_id: string }]>(
      'SELECT tutor_id FROM performance_tables WHERE id = $1;',
      [table.id],
    );
    expect(persistedTable.tutor_id).toBe(owner.id);

    const [persistedFeedback] = await dataSource.query<[{ autor_id: string }]>(
      'SELECT autor_id FROM feedback WHERE id = $1;',
      [feedback.id],
    );
    expect(persistedFeedback.autor_id).toBe(owner.id);

    const [persistedGrade] = await dataSource.query<[{ grade: string }]>(
      'SELECT grade::text FROM session_grades WHERE session_id = $1 AND student_id = $2;',
      [session.id, student.id],
    );
    expect(Number(persistedGrade.grade)).toBe(9.5);
  });

  it('rolls back ownership and tutor links when audit persistence fails', async () => {
    const room = await createRoomWithCoTutor();

    await dataSource.query(`
      CREATE OR REPLACE FUNCTION fail_room_ownership_audit() RETURNS trigger AS $$
      BEGIN
        RAISE EXCEPTION 'Simulated audit failure';
      END;
      $$ LANGUAGE plpgsql;

      CREATE TRIGGER trg_fail_room_ownership_audit
      BEFORE INSERT ON room_ownership_transfers
      FOR EACH ROW EXECUTE FUNCTION fail_room_ownership_audit();
    `);

    try {
      await api(app, owner)
        .patch(`/salas/${room.id}/proprietario`, { professorId: coTutor.id })
        .expect(500);
    } finally {
      await dataSource.query(`
        DROP TRIGGER IF EXISTS trg_fail_room_ownership_audit ON room_ownership_transfers;
        DROP FUNCTION IF EXISTS fail_room_ownership_audit();
      `);
    }

    const [persistedRoom] = await dataSource.query<[{ tutor_id: string }]>(
      'SELECT tutor_id FROM rooms WHERE id = $1;',
      [room.id],
    );
    expect(persistedRoom.tutor_id).toBe(owner.id);

    const audits = await dataSource.query<unknown[]>(
      'SELECT id FROM room_ownership_transfers WHERE room_id = $1;',
      [room.id],
    );
    expect(audits).toHaveLength(0);
  });

  it('prevents inconsistent concurrent ownership transfers', async () => {
    const room = await createRoomWithCoTutor();
    await api(app, owner)
      .post(`/salas/${room.id}/professores`, { professorId: otherTutor.id })
      .expect(201);

    const [resA, resB] = await Promise.all([
      api(app, owner).patch(`/salas/${room.id}/proprietario`, { professorId: coTutor.id }),
      api(app, owner).patch(`/salas/${room.id}/proprietario`, { professorId: otherTutor.id }),
    ]);

    const statuses = [resA.status, resB.status].sort((a, b) => a - b);
    expect(statuses).toEqual([200, 403]);

    const winnerId = resA.status === 200 ? coTutor.id : otherTutor.id;
    const [persistedRoom] = await dataSource.query<[{ tutor_id: string }]>(
      'SELECT tutor_id FROM rooms WHERE id = $1;',
      [room.id],
    );
    expect(persistedRoom.tutor_id).toBe(winnerId);

    const audits = await dataSource.query<{ new_owner_id: string }[]>(
      'SELECT new_owner_id FROM room_ownership_transfers WHERE room_id = $1;',
      [room.id],
    );
    expect(audits).toEqual([{ new_owner_id: winnerId }]);
  });

  it('blocks transfer with 422 when recipient is deactivated concurrently before commit', async () => {
    const room = await createRoomWithCoTutor();
    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.query('UPDATE users SET active = FALSE WHERE id = $1;', [coTutor.id]);
      const transferPromise = api(app, owner).patch(`/salas/${room.id}/proprietario`, {
        professorId: coTutor.id,
      });

      await new Promise((resolve) => setTimeout(resolve, 100));
      await queryRunner.commitTransaction();

      const res = await transferPromise;
      expect(res.status).toBe(422);
    } finally {
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }
      await queryRunner.release();
    }

    const [persistedRoom] = await dataSource.query<[{ tutor_id: string }]>(
      'SELECT tutor_id FROM rooms WHERE id = $1;',
      [room.id],
    );
    expect(persistedRoom.tutor_id).toBe(owner.id);

    const audits = await dataSource.query<unknown[]>(
      'SELECT id FROM room_ownership_transfers WHERE room_id = $1;',
      [room.id],
    );
    expect(audits).toHaveLength(0);
  });

  it('documents PATCH /api/salas/{salaId}/proprietario in Swagger', async () => {
    const res = await request(app.getHttpServer() as Server)
      .get('/api/docs/json')
      .expect(200);
    const doc = res.body as {
      paths: Record<string, { patch?: { responses: Record<string, unknown> } }>;
    };
    const path = doc.paths['/api/salas/{salaId}/proprietario']?.patch;
    expect(path).toBeDefined();
    expect(Object.keys(path!.responses)).toEqual(
      expect.arrayContaining(['200', '400', '401', '403', '404', '422']),
    );
  });
});
