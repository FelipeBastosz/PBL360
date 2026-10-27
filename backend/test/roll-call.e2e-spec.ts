import type { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { UserType } from '@/users/domain/enums/user-type.enum';
import { createTestApp } from './helpers/create-test-app';
import {
  api,
  cleanDatabase,
  insertDefaultPerformanceTable,
  insertUser,
  type TestUser,
} from './helpers/fixtures';

interface RollCallStudentBody {
  alunoId: string;
  nome: string;
  iniciais: string;
  lugar: number | null;
  status: string | null;
  justificativa: string | null;
}

interface RollCallBody {
  sessaoId: string;
  origem: string;
  sessaoReferencia: { id: string; data: string } | null;
  registradaEm: string | null;
  lugares: number;
  alunos: RollCallStudentBody[];
  totais: Record<string, number>;
}

interface ErrorBody {
  statusCode: number;
  message: string | string[];
}

jest.setTimeout(60000);

describe('Roll call (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let tutor: TestUser;
  let outsider: TestUser;
  let students: TestUser[];
  let roomId: string;
  let problemId: string;

  const rollCallPath = (sessionId: string) => `/sessoes/${sessionId}/chamada`;

  const insertStudent = async (index: number, name: string): Promise<TestUser> => {
    const student = await insertUser(
      app,
      dataSource,
      `${20240100 + index}@discente.uefs.br`,
      UserType.STUDENT,
    );
    await dataSource.query('UPDATE users SET name = $2 WHERE id = $1;', [student.id, name]);
    return student;
  };

  const enroll = (student: TestUser) =>
    dataSource.query('INSERT INTO room_students (room_id, student_id) VALUES ($1, $2);', [
      roomId,
      student.id,
    ]);

  const createProblem = async (titulo: string): Promise<string> => {
    const response = await api(app, tutor)
      .post(`/salas/${roomId}/problemas`, { titulo })
      .expect(201);
    return (response.body as { id: string }).id;
  };

  const createSession = async (forProblem: string, data: string): Promise<string> => {
    const response = await api(app, tutor)
      .post(`/salas/${roomId}/problemas/${forProblem}/sessoes`, {
        titulo: `Sessão ${data}`,
        descricao: null,
        data,
      })
      .expect(201);
    return (response.body as { id: string }).id;
  };

  const getRollCall = async (sessionId: string): Promise<RollCallBody> =>
    (await api(app, tutor).get(rollCallPath(sessionId)).expect(200)).body as RollCallBody;

  const putRollCall = (sessionId: string, registros: object[]) =>
    api(app, tutor).put(rollCallPath(sessionId), { registros });

  const studentOf = (body: RollCallBody, student: TestUser) =>
    body.alunos.find((item) => item.alunoId === student.id);

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
    tutor = await insertUser(app, dataSource, 'carlos@uefs.br');
    outsider = await insertUser(app, dataSource, 'maria@uefs.br');
    const room = await api(app, tutor)
      .post('/salas', {
        nome: 'MI Programação - TP01',
        codigoDisciplina: 'EXA863',
        semestre: '2026.2',
      })
      .expect(201);
    roomId = (room.body as { id: string }).id;
    await insertDefaultPerformanceTable(dataSource, tutor.id);
    students = [
      await insertStudent(1, 'Ana Souza'),
      await insertStudent(2, 'Bruno Lima'),
      await insertStudent(3, 'Carla Dias'),
    ];
    for (const student of students) await enroll(student);
    problemId = await createProblem('Sistema de biblioteca');
  });

  describe('GET /sessoes/:sessaoId/chamada', () => {
    it('answers an empty roll call on the first session of the room', async () => {
      const sessionId = await createSession(problemId, '2026-10-01');

      const body = await getRollCall(sessionId);

      expect(body).toMatchObject({
        sessaoId: sessionId,
        origem: 'VAZIA',
        sessaoReferencia: null,
        registradaEm: null,
        lugares: 3,
        totais: { presentes: 0, atrasados: 0, justificados: 0, ausentes: 0, semRegistro: 3 },
      });
      expect(body.alunos.map((item) => [item.nome, item.iniciais])).toEqual([
        ['Ana Souza', 'AS'],
        ['Bruno Lima', 'BL'],
        ['Carla Dias', 'CD'],
      ]);
    });

    it('suggests the table of the previous session of another problem without saving it', async () => {
      const first = await createSession(problemId, '2026-10-01');
      const [ana, bruno, carla] = students as [TestUser, TestUser, TestUser];
      await putRollCall(first, [
        { alunoId: ana.id, status: 'PRESENTE', lugar: 2 },
        { alunoId: bruno.id, status: 'ATRASADO', lugar: 1 },
        { alunoId: carla.id, status: 'JUSTIFICADO', justificativa: 'Atestado médico.' },
      ]).expect(200);
      await dataSource.query('DELETE FROM room_students WHERE student_id = $1;', [bruno.id]);
      const newcomer = await insertStudent(4, 'Diego Alves');
      await enroll(newcomer);
      const otherProblem = await createProblem('Agenda de consultas');
      const second = await createSession(otherProblem, '2026-10-08');

      const body = await getRollCall(second);

      expect(body.origem).toBe('SESSAO_ANTERIOR');
      expect(body.sessaoReferencia).toEqual({ id: first, data: '2026-10-01' });
      expect(body.lugares).toBe(3);
      expect(studentOf(body, ana)).toMatchObject({ lugar: 2, status: 'PRESENTE' });
      expect(studentOf(body, carla)).toMatchObject({
        lugar: null,
        status: null,
        justificativa: null,
      });
      expect(studentOf(body, newcomer)).toMatchObject({ lugar: null, status: null });
      expect(studentOf(body, bruno)).toBeUndefined();
      const [{ total }] = await dataSource.query<[{ total: number }]>(
        'SELECT COUNT(*)::int AS total FROM attendances WHERE session_id = $1;',
        [second],
      );
      expect(total).toBe(0);
    });

    it('does not use a later session as the previous one', async () => {
      const early = await createSession(problemId, '2026-10-01');
      const late = await createSession(problemId, '2026-10-20');
      await putRollCall(late, [{ alunoId: students[0]!.id, status: 'PRESENTE', lugar: 1 }]).expect(
        200,
      );

      expect((await getRollCall(early)).origem).toBe('VAZIA');
    });

    it('denies a tutor who is not linked to the room', async () => {
      const sessionId = await createSession(problemId, '2026-10-01');

      await api(app, outsider).get(rollCallPath(sessionId)).expect(403);
    });
  });

  describe('PUT /sessoes/:sessaoId/chamada', () => {
    let sessionId: string;

    beforeEach(async () => {
      sessionId = await createSession(problemId, '2026-10-01');
    });

    it('records the batch with the server time and the authenticated tutor', async () => {
      const [ana, bruno, carla] = students as [TestUser, TestUser, TestUser];

      const response = await putRollCall(sessionId, [
        { alunoId: ana.id, status: 'PRESENTE', lugar: 1 },
        { alunoId: bruno.id, status: 'AUSENTE', lugar: null },
        { alunoId: carla.id, status: 'JUSTIFICADO', justificativa: 'Atestado médico.' },
      ]).expect(200);
      const body = response.body as RollCallBody;

      expect(body.origem).toBe('REGISTRADA');
      expect(body.registradaEm).toEqual(expect.any(String));
      expect(body.totais).toEqual({
        presentes: 1,
        atrasados: 0,
        justificados: 1,
        ausentes: 1,
        semRegistro: 0,
      });
      expect(studentOf(body, carla)).toMatchObject({
        status: 'JUSTIFICADO',
        justificativa: 'Atestado médico.',
      });
      const rows = await dataSource.query<Array<{ recordedBy: string }>>(
        'SELECT recorded_by AS "recordedBy" FROM attendances WHERE session_id = $1;',
        [sessionId],
      );
      expect(rows.every((row) => row.recordedBy === tutor.id)).toBe(true);
      expect(await getRollCall(sessionId)).toEqual(body);
    });

    it('keeps the record of students left out of the batch', async () => {
      const [ana, bruno] = students as [TestUser, TestUser];
      await putRollCall(sessionId, [
        { alunoId: ana.id, status: 'PRESENTE', lugar: 1 },
        { alunoId: bruno.id, status: 'PRESENTE', lugar: 2 },
      ]).expect(200);

      const body = (
        await putRollCall(sessionId, [{ alunoId: ana.id, status: 'ATRASADO', lugar: 1 }]).expect(
          200,
        )
      ).body as RollCallBody;

      expect(studentOf(body, ana)).toMatchObject({ status: 'ATRASADO', lugar: 1 });
      expect(studentOf(body, bruno)).toMatchObject({ status: 'PRESENTE', lugar: 2 });
    });

    it('releases the session role of a student taken off the table', async () => {
      const [ana, bruno] = students as [TestUser, TestUser];
      await putRollCall(sessionId, [
        { alunoId: ana.id, status: 'PRESENTE', lugar: 1 },
        { alunoId: bruno.id, status: 'PRESENTE', lugar: 2 },
      ]).expect(200);
      await api(app, tutor)
        .put(`/sessoes/${sessionId}/papeis/${ana.id}`, { papel: 'COORDENADOR' })
        .expect(200);
      await api(app, tutor)
        .put(`/sessoes/${sessionId}/papeis/${bruno.id}`, { papel: 'SECRETARIO_MESA' })
        .expect(200);

      const body = (
        await putRollCall(sessionId, [{ alunoId: ana.id, status: 'AUSENTE', lugar: null }]).expect(
          200,
        )
      ).body as RollCallBody;

      expect(studentOf(body, ana)).toMatchObject({ status: 'AUSENTE', lugar: null });
      const roles = (await api(app, tutor).get(`/sessoes/${sessionId}/papeis`).expect(200))
        .body as Array<{ alunoId: string; papel: string }>;
      expect(roles).toEqual([
        expect.objectContaining({ alunoId: bruno.id, papel: 'SECRETARIO_MESA' }),
      ]);
    });

    it('swaps two students between seats in one batch', async () => {
      const [ana, bruno] = students as [TestUser, TestUser];
      await putRollCall(sessionId, [
        { alunoId: ana.id, status: 'PRESENTE', lugar: 1 },
        { alunoId: bruno.id, status: 'PRESENTE', lugar: 2 },
      ]).expect(200);

      const body = (
        await putRollCall(sessionId, [
          { alunoId: ana.id, status: 'PRESENTE', lugar: 2 },
          { alunoId: bruno.id, status: 'PRESENTE', lugar: 1 },
        ]).expect(200)
      ).body as RollCallBody;

      expect(studentOf(body, ana)?.lugar).toBe(2);
      expect(studentOf(body, bruno)?.lugar).toBe(1);
    });

    it.each([
      [
        { status: 'PRESENTE', justificativa: 'Atrasou o ônibus' },
        'A justificativa só pode ser informada em faltas justificadas.',
      ],
      [
        { status: 'AUSENTE', lugar: 1 },
        'Só alunos presentes ou atrasados podem ocupar um lugar na mesa.',
      ],
      [
        { status: 'JUSTIFICADO', lugar: 2 },
        'Só alunos presentes ou atrasados podem ocupar um lugar na mesa.',
      ],
    ])('answers 400 for an incoherent record %o', async (record, message) => {
      const response = await putRollCall(sessionId, [
        { alunoId: students[0]!.id, ...record },
      ]).expect(400);

      expect((response.body as ErrorBody).message).toContain(message);
    });

    it('answers 400 for an empty batch', async () => {
      await putRollCall(sessionId, []).expect(400);
    });

    it('answers 409 when two students take the same seat in the batch', async () => {
      await putRollCall(sessionId, [
        { alunoId: students[0]!.id, status: 'PRESENTE', lugar: 1 },
        { alunoId: students[1]!.id, status: 'PRESENTE', lugar: 1 },
      ]).expect(409);
    });

    it('answers 409 when the seat belongs to a student kept from a previous save', async () => {
      await putRollCall(sessionId, [
        { alunoId: students[0]!.id, status: 'PRESENTE', lugar: 1 },
      ]).expect(200);

      const response = await putRollCall(sessionId, [
        { alunoId: students[1]!.id, status: 'PRESENTE', lugar: 1 },
      ]).expect(409);

      expect((response.body as ErrorBody).message).toBe(
        'Dois alunos não podem ocupar o mesmo lugar na mesa.',
      );
    });

    it('answers 422 for a student who is not enrolled in the room', async () => {
      const stranger = await insertStudent(9, 'Eva Rocha');

      await putRollCall(sessionId, [{ alunoId: stranger.id, status: 'PRESENTE' }]).expect(422);
    });

    it('answers 422 for a seat beyond the table', async () => {
      const response = await putRollCall(sessionId, [
        { alunoId: students[0]!.id, status: 'PRESENTE', lugar: 4 },
      ]).expect(422);

      expect((response.body as ErrorBody).message).toBe(
        'O lugar 4 não existe na mesa, que tem 3 lugares.',
      );
    });

    it('denies a tutor who is not linked to the room', async () => {
      await api(app, outsider)
        .put(rollCallPath(sessionId), {
          registros: [{ alunoId: students[0]!.id, status: 'PRESENTE' }],
        })
        .expect(403);
    });
  });

  describe('response time for a class of 15 students', () => {
    it('saves and reads the roll call, with suggestion, within 3 seconds', async () => {
      for (let index = 10; index < 22; index += 1) {
        const extra = await insertStudent(index, `Aluno ${index}`);
        await enroll(extra);
        students.push(extra);
      }
      const first = await createSession(problemId, '2026-10-01');
      const second = await createSession(problemId, '2026-10-08');
      const registros = students.map((student, index) => ({
        alunoId: student.id,
        status: 'PRESENTE',
        lugar: index + 1,
      }));

      let startedAt = Date.now();
      await putRollCall(first, registros).expect(200);
      expect(Date.now() - startedAt).toBeLessThan(3000);

      startedAt = Date.now();
      const suggestion = await getRollCall(second);
      expect(Date.now() - startedAt).toBeLessThan(3000);
      expect(suggestion.lugares).toBe(15);
      expect(suggestion.totais.presentes).toBe(15);
    });
  });
});
