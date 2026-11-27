import type { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { UserType } from '@/users/domain/enums/user-type.enum';
import { createTestApp } from './helpers/create-test-app';
import { api, cleanDatabase, insertUser, type TestUser } from './helpers/fixtures';

interface DeliveryBody {
  id: string;
  url: string;
  enviadoPor: { id: string; nome: string };
  enviadoEm: string;
}

interface DeliveriesListBody {
  minhaEntregaId: string | null;
  entregas: DeliveryBody[];
}

const UNKNOWN_UUID = '00000000-0000-4000-8000-000000000000';

jest.setTimeout(60000);

describe('Problem deliveries (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let ownerTutor: TestUser;
  let coTutor: TestUser;
  let unrelatedTutor: TestUser;
  let studentA: TestUser;
  let studentB: TestUser;
  let outsiderStudent: TestUser;
  let roomId: string;
  let otherRoomId: string;
  let problemId: string;
  let otherRoomProblemId: string;

  const deliveriesPath = (targetRoomId = roomId, targetProblemId = problemId) =>
    `/salas/${targetRoomId}/problemas/${targetProblemId}/entregas`;

  beforeAll(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
    dataSource = testApp.moduleRef.get(DataSource);
  });

  afterAll(async () => {
    await cleanDatabase(dataSource);
    await app.close();
  });

  beforeEach(async () => {
    await cleanDatabase(dataSource);
    ownerTutor = await insertUser(app, dataSource, 'owner@uefs.br', UserType.TUTOR);
    coTutor = await insertUser(app, dataSource, 'cotutor@uefs.br', UserType.TUTOR);
    unrelatedTutor = await insertUser(app, dataSource, 'outsider-tutor@uefs.br', UserType.TUTOR);
    studentA = await insertUser(app, dataSource, '20240101@discente.uefs.br', UserType.STUDENT);
    studentB = await insertUser(app, dataSource, '20240102@discente.uefs.br', UserType.STUDENT);
    outsiderStudent = await insertUser(
      app,
      dataSource,
      '20240103@discente.uefs.br',
      UserType.STUDENT,
    );

    await dataSource.query("UPDATE users SET name = 'Ana Souza' WHERE id = $1;", [studentA.id]);
    await dataSource.query("UPDATE users SET name = 'Bruno Lima' WHERE id = $1;", [studentB.id]);

    const room = await api(app, ownerTutor)
      .post('/salas', {
        nome: 'MI Programação - TP01',
        codigoDisciplina: 'EXA863',
        semestre: '2026.2',
      })
      .expect(201);
    roomId = (room.body as { id: string }).id;

    const otherRoom = await api(app, ownerTutor)
      .post('/salas', {
        nome: 'MI Programação - TP02',
        codigoDisciplina: 'EXA864',
        semestre: '2026.2',
      })
      .expect(201);
    otherRoomId = (otherRoom.body as { id: string }).id;

    await dataSource.query('INSERT INTO room_tutors (room_id, tutor_id) VALUES ($1, $2);', [
      roomId,
      coTutor.id,
    ]);
    await dataSource.query(
      'INSERT INTO room_students (room_id, student_id) VALUES ($1, $2), ($1, $3);',
      [roomId, studentA.id, studentB.id],
    );

    const problem = await api(app, ownerTutor)
      .post(`/salas/${roomId}/problemas`, { titulo: 'Sistema de biblioteca' })
      .expect(201);
    problemId = (problem.body as { id: string }).id;

    const otherProblem = await api(app, ownerTutor)
      .post(`/salas/${otherRoomId}/problemas`, { titulo: 'Outro problema' })
      .expect(201);
    otherRoomProblemId = (otherProblem.body as { id: string }).id;
  });

  describe('POST /salas/:salaId/problemas/:problemaId/entregas', () => {
    it('registers a Google Drive HTTPS link for an enrolled student without creating grades or touching session attachments', async () => {
      const url = 'https://drive.google.com/drive/folders/1AbCdEfGhIjKlMnOp?usp=sharing';

      const response = await api(app, studentA).post(deliveriesPath(), { url }).expect(201);
      const body = response.body as DeliveryBody;

      expect(Object.keys(body).sort()).toEqual(['enviadoEm', 'enviadoPor', 'id', 'url']);
      expect(body).toMatchObject({
        url,
        enviadoPor: { id: studentA.id, nome: 'Ana Souza' },
      });
      expect(Number.isNaN(Date.parse(body.enviadoEm))).toBe(false);

      const stored = await dataSource.query<
        Array<{ submitted_by: string; replaced_at: Date | null }>
      >('SELECT submitted_by, replaced_at FROM problem_deliveries WHERE id = $1;', [body.id]);
      expect(stored).toEqual([{ submitted_by: studentA.id, replaced_at: null }]);

      const grades = await dataSource.query<[{ count: string }]>(
        'SELECT COUNT(*)::int AS count FROM problem_grades WHERE problem_id = $1;',
        [problemId],
      );
      expect(Number(grades[0].count)).toBe(0);

      const attachments = await dataSource.query<[{ count: string }]>(
        'SELECT COUNT(*)::int AS count FROM session_attachments;',
      );
      expect(Number(attachments[0].count)).toBe(0);
    });

    it('accepts a GitHub HTTPS repository link', async () => {
      const url = 'https://github.com/uefs/pbl360-entrega';

      const response = await api(app, studentA).post(deliveriesPath(), { url }).expect(201);

      expect((response.body as DeliveryBody).url).toBe(url);
    });

    it('rejects empty, invalid, non-HTTPS URLs, credentials, IP hosts and unexpected payload fields with 400', async () => {
      const emptyBody = await api(app, studentA).post(deliveriesPath(), {}).expect(400);
      expect((emptyBody.body as { message: string[] }).message).toEqual([
        'A URL da entrega é obrigatória e deve ser um texto.',
      ]);

      await api(app, studentA).post(deliveriesPath(), { url: '' }).expect(400);
      await api(app, studentA).post(deliveriesPath(), { url: '   ' }).expect(400);
      await api(app, studentA)
        .post(deliveriesPath(), { url: 'http://github.com/uefs/pbl360' })
        .expect(400);
      await api(app, studentA)
        .post(deliveriesPath(), { url: 'ftp://files.example.com/entrega.zip' })
        .expect(400);
      await api(app, studentA).post(deliveriesPath(), { url: 'not-a-valid-url' }).expect(400);
      await api(app, studentA)
        .post(deliveriesPath(), { url: 'https://user:senha@github.com/uefs/pbl360' })
        .expect(400);
      await api(app, studentA)
        .post(deliveriesPath(), { url: 'https://10.0.0.1/admin' })
        .expect(400);
      await api(app, studentA).post(deliveriesPath(), { url: 'https://[::1]/admin' }).expect(400);
      await api(app, studentA)
        .post(deliveriesPath(), {
          url: 'https://github.com/uefs/pbl360',
          alunoId: studentB.id,
        })
        .expect(400);
      await api(app, studentA)
        .post(deliveriesPath('not-a-uuid', problemId), { url: 'https://github.com/uefs/pbl360' })
        .expect(400);
    });

    it('rejects unauthenticated requests with 401', async () => {
      await api(app).post(deliveriesPath(), { url: 'https://github.com/uefs/pbl360' }).expect(401);
    });

    it('blocks tutors, co-tutors, and non-enrolled students with 403', async () => {
      const payload = { url: 'https://github.com/uefs/pbl360' };

      await api(app, ownerTutor).post(deliveriesPath(), payload).expect(403);
      await api(app, coTutor).post(deliveriesPath(), payload).expect(403);
      await api(app, unrelatedTutor).post(deliveriesPath(), payload).expect(403);
      await api(app, outsiderStudent).post(deliveriesPath(), payload).expect(403);
    });

    it('returns 404 when room does not exist, is deleted, or problem does not belong to room', async () => {
      const payload = { url: 'https://github.com/uefs/pbl360' };

      await api(app, studentA).post(deliveriesPath(UNKNOWN_UUID, problemId), payload).expect(404);
      await api(app, studentA).post(deliveriesPath(roomId, UNKNOWN_UUID), payload).expect(404);
      await api(app, studentA)
        .post(deliveriesPath(roomId, otherRoomProblemId), payload)
        .expect(404);

      await dataSource.query('UPDATE rooms SET deleted_at = now() WHERE id = $1;', [roomId]);
      await api(app, studentA).post(deliveriesPath(), payload).expect(404);
    });

    it('replaces only the sender active delivery on resubmission while preserving history and classmates', async () => {
      const firstA = (
        await api(app, studentA)
          .post(deliveriesPath(), { url: 'https://github.com/uefs/student-a-v1' })
          .expect(201)
      ).body as DeliveryBody;
      const deliveryB = (
        await api(app, studentB)
          .post(deliveriesPath(), { url: 'https://github.com/uefs/student-b-v1' })
          .expect(201)
      ).body as DeliveryBody;
      const secondA = (
        await api(app, studentA)
          .post(deliveriesPath(), { url: 'https://github.com/uefs/student-a-v2' })
          .expect(201)
      ).body as DeliveryBody;

      expect(secondA.id).not.toBe(firstA.id);

      const allDeliveries = await dataSource.query<Array<{ id: string; replaced_at: Date | null }>>(
        'SELECT id, replaced_at FROM problem_deliveries WHERE problem_id = $1;',
        [problemId],
      );
      expect(allDeliveries).toHaveLength(3);
      expect(allDeliveries.find((row) => row.id === firstA.id)?.replaced_at).not.toBeNull();
      expect(allDeliveries.find((row) => row.id === deliveryB.id)?.replaced_at).toBeNull();
      expect(allDeliveries.find((row) => row.id === secondA.id)?.replaced_at).toBeNull();

      const studentAList = (await api(app, studentA).get(deliveriesPath()).expect(200))
        .body as DeliveriesListBody;
      expect(studentAList).toEqual({ minhaEntregaId: secondA.id, entregas: [secondA] });

      const studentBList = (await api(app, studentB).get(deliveriesPath()).expect(200))
        .body as DeliveriesListBody;
      expect(studentBList).toEqual({ minhaEntregaId: deliveryB.id, entregas: [deliveryB] });

      const tutorList = (await api(app, ownerTutor).get(deliveriesPath()).expect(200))
        .body as DeliveriesListBody;
      expect(tutorList.minhaEntregaId).toBeNull();
      expect(tutorList.entregas.map((item) => item.id)).toEqual([secondA.id, deliveryB.id]);
    });

    it('rolls back previous delivery replacement atomically when insert fails mid-transaction', async () => {
      const first = (
        await api(app, studentA)
          .post(deliveriesPath(), { url: 'https://github.com/uefs/atomic-v1' })
          .expect(201)
      ).body as DeliveryBody;

      await dataSource.query(`
        CREATE OR REPLACE FUNCTION fail_problem_delivery_insert()
        RETURNS TRIGGER AS $$
        BEGIN
          RAISE EXCEPTION 'simulated insert failure';
        END;
        $$ LANGUAGE plpgsql;

        CREATE TRIGGER trg_fail_problem_delivery_insert
        BEFORE INSERT ON problem_deliveries
        FOR EACH ROW EXECUTE FUNCTION fail_problem_delivery_insert();
      `);

      try {
        await api(app, studentA)
          .post(deliveriesPath(), { url: 'https://github.com/uefs/atomic-v2' })
          .expect(500);
      } finally {
        await dataSource.query(`
          DROP TRIGGER IF EXISTS trg_fail_problem_delivery_insert ON problem_deliveries;
          DROP FUNCTION IF EXISTS fail_problem_delivery_insert();
        `);
      }

      const deliveries = await dataSource.query<Array<{ id: string; replaced_at: Date | null }>>(
        'SELECT id, replaced_at FROM problem_deliveries WHERE problem_id = $1;',
        [problemId],
      );
      expect(deliveries).toEqual([{ id: first.id, replaced_at: null }]);
    });
  });

  describe('GET /salas/:salaId/problemas/:problemaId/entregas', () => {
    it('lets owner tutor and co-tutor list all active deliveries with author metadata', async () => {
      const first = (
        await api(app, studentA)
          .post(deliveriesPath(), { url: 'https://drive.google.com/drive/folders/student-a' })
          .expect(201)
      ).body as DeliveryBody;
      const second = (
        await api(app, studentB)
          .post(deliveriesPath(), { url: 'https://github.com/uefs/student-b' })
          .expect(201)
      ).body as DeliveryBody;

      const ownerResponse = (await api(app, ownerTutor).get(deliveriesPath()).expect(200))
        .body as DeliveriesListBody;
      expect(ownerResponse).toEqual({
        minhaEntregaId: null,
        entregas: [second, first],
      });

      const coTutorResponse = (await api(app, coTutor).get(deliveriesPath()).expect(200))
        .body as DeliveriesListBody;
      expect(coTutorResponse).toEqual({
        minhaEntregaId: null,
        entregas: [second, first],
      });
    });

    it('hides deliveries of students removed from the room while preserving database history', async () => {
      const deliveryA = (
        await api(app, studentA)
          .post(deliveriesPath(), { url: 'https://drive.google.com/drive/folders/student-a' })
          .expect(201)
      ).body as DeliveryBody;
      await api(app, studentB)
        .post(deliveriesPath(), { url: 'https://github.com/uefs/student-b' })
        .expect(201);

      await dataSource.query('DELETE FROM room_students WHERE room_id = $1 AND student_id = $2;', [
        roomId,
        studentB.id,
      ]);

      const tutorResponse = (await api(app, ownerTutor).get(deliveriesPath()).expect(200))
        .body as DeliveriesListBody;
      expect(tutorResponse).toEqual({
        minhaEntregaId: null,
        entregas: [deliveryA],
      });

      const [stored] = await dataSource.query<[{ count: number }]>(
        'SELECT COUNT(*)::int AS count FROM problem_deliveries WHERE problem_id = $1;',
        [problemId],
      );
      expect(stored.count).toBe(2);
    });

    it('includes deliveries in problem deletion impact and blocks problem deletion with 409', async () => {
      await api(app, studentA)
        .post(deliveriesPath(), { url: 'https://github.com/uefs/student-a' })
        .expect(201);

      const impact = await api(app, ownerTutor)
        .get(`/salas/${roomId}/problemas/${problemId}/impacto-exclusao`)
        .expect(200);
      expect(impact.body).toEqual({
        sessoes: 0,
        notas: 0,
        feedbacks: 0,
        avaliacoes: 0,
        entregas: 1,
      });

      const conflict = await api(app, ownerTutor)
        .delete(`/salas/${roomId}/problemas/${problemId}`)
        .expect(409);
      expect(conflict.body).toEqual({
        statusCode: 409,
        error: 'Conflict',
        message: 'O problema não pode ser excluído pois possui registros vinculados.',
        detalhes: {
          sessoes: 0,
          notas: 0,
          feedbacks: 0,
          avaliacoes: 0,
          entregas: 1,
        },
      });

      const [stored] = await dataSource.query<[{ count: number }]>(
        'SELECT COUNT(*)::int AS count FROM problem_deliveries WHERE problem_id = $1;',
        [problemId],
      );
      expect(stored.count).toBe(1);
    });

    it('lets an enrolled student see only their own active delivery and hides classmates links', async () => {
      const deliveryA = (
        await api(app, studentA)
          .post(deliveriesPath(), { url: 'https://drive.google.com/drive/folders/student-a' })
          .expect(201)
      ).body as DeliveryBody;

      const responseA = (await api(app, studentA).get(deliveriesPath()).expect(200))
        .body as DeliveriesListBody;
      expect(responseA).toEqual({
        minhaEntregaId: deliveryA.id,
        entregas: [deliveryA],
      });

      const responseB = (await api(app, studentB).get(deliveriesPath()).expect(200))
        .body as DeliveriesListBody;
      expect(responseB).toEqual({
        minhaEntregaId: null,
        entregas: [],
      });
    });

    it('rejects unauthenticated requests with 401 and non-members with 403', async () => {
      await api(app).get(deliveriesPath()).expect(401);
      await api(app, unrelatedTutor).get(deliveriesPath()).expect(403);
      await api(app, outsiderStudent).get(deliveriesPath()).expect(403);
    });

    it('validates room -> problem chain with 404', async () => {
      await api(app, ownerTutor).get(deliveriesPath(UNKNOWN_UUID, problemId)).expect(404);
      await api(app, ownerTutor).get(deliveriesPath(roomId, UNKNOWN_UUID)).expect(404);
      await api(app, ownerTutor).get(deliveriesPath(roomId, otherRoomProblemId)).expect(404);

      await dataSource.query('UPDATE rooms SET deleted_at = now() WHERE id = $1;', [roomId]);
      await api(app, ownerTutor).get(deliveriesPath()).expect(404);
    });
  });
});
