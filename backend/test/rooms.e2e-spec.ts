import type { INestApplication } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { UserType } from '@/users/domain/enums/user-type.enum';
import { createTestApp } from './helpers/create-test-app';
import { api, cleanDatabase, insertUser, type TestUser } from './helpers/fixtures';

interface RoomBody {
  id: string;
  professorResponsavelId: string;
  nome: string;
  codigoDisciplina: string;
  codigoSala: string;
  semestre: string;
  ativo: boolean;
  criadoEm: string;
}

interface StudentRoomBody {
  salaId: string;
  nome: string;
  semestre: string;
  totalAlunos: number;
  totalProblemas: number;
}

interface RoomStudentBody {
  id: string;
  nome: string;
  email: string;
  matricula: string | null;
  dataEntrada: string;
}

const NEW_ROOM = { nome: 'Engenharia de Software', codigoDisciplina: 'exa123', semestre: '2026.2' };
const MISSING_ID = '00000000-0000-4000-8000-000000000000';

describe('Rooms (e2e)', () => {
  let app: INestApplication;
  let moduleRef: TestingModule;
  let dataSource: DataSource;
  let owner: TestUser;
  let colleague: TestUser;
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
    owner = await insertUser(app, dataSource, 'carlos@uefs.br');
    colleague = await insertUser(app, dataSource, 'maria@uefs.br');
    student = await insertUser(app, dataSource, '20240001@discente.uefs.br', UserType.STUDENT);
  });

  const createRoom = async (): Promise<RoomBody> => {
    const response = await api(app, owner).post('/salas', NEW_ROOM).expect(201);
    return response.body as RoomBody;
  };

  const deletedAtOf = async (roomId: string): Promise<Date | null> => {
    const [row] = await dataSource.query<[{ deleted_at: Date | null }]>(
      'SELECT deleted_at FROM rooms WHERE id = $1;',
      [roomId],
    );
    return row.deleted_at;
  };

  const enrolledStudentCount = async (roomId: string): Promise<number> => {
    const [row] = await dataSource.query<[{ count: string }]>(
      'SELECT COUNT(*)::text AS count FROM room_students WHERE room_id = $1 AND student_id = $2;',
      [roomId, student.id],
    );
    return Number(row.count);
  };

  describe('POST /salas', () => {
    it('creates a room owned by the authenticated tutor, in Portuguese', async () => {
      const room = await createRoom();

      expect(room).toMatchObject({
        professorResponsavelId: owner.id,
        nome: 'Engenharia de Software',
        codigoDisciplina: 'EXA123',
        semestre: '2026.2',
        ativo: true,
      });
      expect(room.codigoSala).toMatch(/^[A-Za-z0-9]{8}$/);
    });

    it('refuses a tutor id sent in the body', async () => {
      await api(app, owner)
        .post('/salas', { ...NEW_ROOM, tutorId: colleague.id })
        .expect(400)
        .expect(({ body }) =>
          expect((body as { message: string[] }).message).toContain(
            'O campo "tutorId" não é permitido.',
          ),
        );
    });

    it('answers 400, not 500, for a semester made of spaces', async () => {
      await api(app, owner)
        .post('/salas', { ...NEW_ROOM, semestre: '   ' })
        .expect(400);
    });

    it('is forbidden to students', async () => {
      await api(app, student).post('/salas', NEW_ROOM).expect(403);
    });

    it('requires authentication', async () => {
      await api(app).post('/salas', NEW_ROOM).expect(401);
    });
  });

  describe('GET /salas', () => {
    it('lists only the rooms linked to the tutor', async () => {
      const room = await createRoom();

      const mine = await api(app, owner).get('/salas').expect(200);
      const theirs = await api(app, colleague).get('/salas').expect(200);

      expect((mine.body as RoomBody[]).map((r) => r.id)).toEqual([room.id]);
      expect(theirs.body).toEqual([]);
    });
  });

  describe('GET /salas/minhas', () => {
    it('lists only the student rooms and includes their total enrollment', async () => {
      const room = await createRoom();
      const unrelatedRoom = await api(app, colleague).post('/salas', NEW_ROOM).expect(201);
      const unrelatedRoomBody = unrelatedRoom.body as RoomBody;
      const secondStudent = await insertUser(
        app,
        dataSource,
        '20240002@discente.uefs.br',
        UserType.STUDENT,
      );
      await dataSource.query(
        'INSERT INTO room_students (room_id, student_id) VALUES ($1, $2), ($1, $3), ($4, $3);',
        [room.id, student.id, secondStudent.id, unrelatedRoomBody.id],
      );
      await dataSource.query(
        `INSERT INTO problems (room_id, title, order_index, created_by)
         VALUES ($1, 'Problema 1', 1, $2), ($1, 'Problema 2', 2, $2), ($3, 'Outro problema', 1, $2);`,
        [room.id, owner.id, unrelatedRoomBody.id],
      );

      const response = await api(app, student).get('/salas/minhas').expect(200);
      const listedRooms = response.body as StudentRoomBody[];

      expect(listedRooms).toEqual([
        {
          salaId: room.id,
          nome: room.nome,
          semestre: room.semestre,
          totalAlunos: 2,
          totalProblemas: 2,
        },
      ]);
    });

    it('is forbidden to tutors', async () => {
      await api(app, owner).get('/salas/minhas').expect(403);
    });
  });

  describe('POST /salas/ingressar', () => {
    it('enters by code and returns the same success response on retries', async () => {
      const room = await createRoom();
      const enter = () =>
        api(app, student).post('/salas/ingressar/codigo', { codigoSala: room.codigoSala });
      const expected = { mensagem: 'Entrada na sala realizada com sucesso.' };

      await enter().expect(200, expected);
      await enter().expect(200, expected);

      expect(await enrolledStudentCount(room.id)).toBe(1);
    });

    it('enters by the shared invite link using the same behavior', async () => {
      const room = await createRoom();

      await api(app, student)
        .post('/salas/ingressar/link', {
          link: `https://pbl360.com/salas/${room.codigoSala}`,
        })
        .expect(200, { mensagem: 'Entrada na sala realizada com sucesso.' });

      expect(await enrolledStudentCount(room.id)).toBe(1);
    });

    it('uses the same not-found response for an unknown code and inactive room', async () => {
      const room = await createRoom();
      const unavailable = {
        statusCode: 404,
        message: 'Código de ingresso inválido ou sala indisponível.',
        error: 'Not Found',
      };

      await api(app, student)
        .post('/salas/ingressar/codigo', { codigoSala: 'invalid1' })
        .expect(404, unavailable);
      await api(app, owner).patch(`/salas/${room.id}`, { ativo: false }).expect(200);
      await api(app, student)
        .post('/salas/ingressar/codigo', { codigoSala: room.codigoSala })
        .expect(404, unavailable);
    });

    it('rejects malformed links and non-student users', async () => {
      await api(app, student)
        .post('/salas/ingressar/link', { link: 'https://pbl360.com/outra/aB7kP2x9' })
        .expect(400);
      await api(app, owner).post('/salas/ingressar/codigo', { codigoSala: 'aB7kP2x9' }).expect(403);
    });
  });

  describe('GET /salas/:id/alunos', () => {
    it('lists student profile data for a linked tutor and an enrolled student', async () => {
      const room = await createRoom();
      const secondStudent = await insertUser(
        app,
        dataSource,
        '20240002@discente.uefs.br',
        UserType.STUDENT,
      );
      await dataSource.query(
        'INSERT INTO room_students (room_id, student_id) VALUES ($1, $2), ($1, $3);',
        [room.id, student.id, secondStudent.id],
      );

      const response = await api(app, owner).get(`/salas/${room.id}/alunos`).expect(200);
      const listedStudents = response.body as RoomStudentBody[];

      expect(listedStudents).toHaveLength(2);
      expect(listedStudents.map((entry) => entry.nome)).toEqual([
        'Usuário de Teste',
        'Usuário de Teste',
      ]);
      expect(listedStudents.every((entry) => Number.isFinite(Date.parse(entry.dataEntrada)))).toBe(
        true,
      );
      expect(listedStudents).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: student.id,
            email: student.email,
            matricula: student.email.slice(0, 8),
          }),
          expect.objectContaining({ id: secondStudent.id }),
        ]),
      );

      await api(app, student).get(`/salas/${room.id}/alunos`).expect(200, listedStudents);
    });

    it('is forbidden to a tutor not linked to the room', async () => {
      const room = await createRoom();

      await api(app, colleague).get(`/salas/${room.id}/alunos`).expect(403);
    });

    it('is forbidden to students who are not enrolled', async () => {
      const room = await createRoom();

      await api(app, student).get(`/salas/${room.id}/alunos`).expect(403);
    });
  });

  describe('GET /salas/:id', () => {
    it('shows the room to a linked tutor', async () => {
      const room = await createRoom();
      await api(app, owner).post(`/salas/${room.id}/professores`, { professorId: colleague.id });

      const response = await api(app, colleague).get(`/salas/${room.id}`).expect(200);

      expect(response.body).toEqual(room);
    });

    it('is forbidden to a tutor not linked to the room', async () => {
      const room = await createRoom();

      await api(app, colleague).get(`/salas/${room.id}`).expect(403);
    });

    it('answers 404 for a deleted room', async () => {
      const room = await createRoom();
      await api(app, owner).delete(`/salas/${room.id}`).expect(204);

      await api(app, owner).get(`/salas/${room.id}`).expect(404);
    });

    it('answers 400 for an id that is not a UUID', async () => {
      await api(app, owner).get('/salas/abc').expect(400);
    });
  });

  describe('PATCH /salas/:id', () => {
    it('updates the informed fields', async () => {
      const room = await createRoom();

      const response = await api(app, owner)
        .patch(`/salas/${room.id}`, { nome: 'Sala Nova', ativo: false })
        .expect(200);

      expect(response.body).toMatchObject({ id: room.id, nome: 'Sala Nova', ativo: false });
    });

    it('rejects an empty name', async () => {
      const room = await createRoom();

      await api(app, owner).patch(`/salas/${room.id}`, { nome: '' }).expect(400);
    });

    it('answers 400 for an id that is not a UUID', async () => {
      await api(app, owner).patch('/salas/abc', { nome: 'x' }).expect(400);
    });

    it('is forbidden to a tutor not linked to the room', async () => {
      const room = await createRoom();

      await api(app, colleague).patch(`/salas/${room.id}`, { nome: 'x' }).expect(403);
    });
  });

  describe('DELETE /salas/:id', () => {
    it('soft deletes the room and hides it afterwards', async () => {
      const room = await createRoom();

      await api(app, owner).delete(`/salas/${room.id}`).expect(204);

      expect(await deletedAtOf(room.id)).not.toBeNull();
      await api(app, owner).get('/salas').expect(200, []);
      await api(app, owner).patch(`/salas/${room.id}`, { ativo: true }).expect(404);
      await api(app, owner).delete(`/salas/${room.id}`).expect(404);
    });

    it('is forbidden to anyone but the owner, even a linked tutor', async () => {
      const room = await createRoom();
      await api(app, owner).post(`/salas/${room.id}/professores`, { professorId: colleague.id });

      await api(app, colleague).delete(`/salas/${room.id}`).expect(403);
      expect(await deletedAtOf(room.id)).toBeNull();
    });

    it('answers 404 for a room that does not exist', async () => {
      await api(app, owner).delete(`/salas/${MISSING_ID}`).expect(404);
    });
  });

  describe('tutors of a room', () => {
    it('adds and removes a tutor', async () => {
      const room = await createRoom();

      await api(app, owner)
        .post(`/salas/${room.id}/professores`, { professorId: colleague.id })
        .expect(201, { mensagem: 'Professor associado à sala com sucesso.' });
      await api(app, colleague).get('/salas').expect(200);

      await api(app, owner)
        .delete(`/salas/${room.id}/professores/${colleague.id}`)
        .expect(200, { mensagem: 'Professor removido da sala com sucesso.' });
    });

    it('answers 409 when the tutor is already linked', async () => {
      const room = await createRoom();
      const add = () =>
        api(app, owner).post(`/salas/${room.id}/professores`, { professorId: colleague.id });

      const results = await Promise.all([add(), add()]);

      expect(results.map((r) => r.status).sort()).toEqual([201, 409]);
    });

    it('refuses a student as tutor', async () => {
      const room = await createRoom();

      await api(app, owner)
        .post(`/salas/${room.id}/professores`, { professorId: student.id })
        .expect(404);
    });

    it('never removes the owner', async () => {
      const room = await createRoom();

      await api(app, owner).delete(`/salas/${room.id}/professores/${owner.id}`).expect(403);
    });

    it('does not manage tutors of a deleted room', async () => {
      const room = await createRoom();
      await api(app, owner).delete(`/salas/${room.id}`).expect(204);

      await api(app, owner)
        .post(`/salas/${room.id}/professores`, { professorId: colleague.id })
        .expect(404);
    });
  });

  describe('DELETE /salas/:salaId/membros/me', () => {
    it('allows a student to leave voluntarily (204) and keeps historical records intact', async () => {
      const room = await createRoom();

      await dataSource.query('INSERT INTO room_students (room_id, student_id) VALUES ($1, $2);', [
        room.id,
        student.id,
      ]);
      expect(await enrolledStudentCount(room.id)).toBe(1);

      const [problem] = await dataSource.query<[{ id: string }]>(
        `INSERT INTO problems (room_id, title, description, order_index, created_by)
         VALUES ($1, 'Problema 1', 'Descrição', 1, $2)
         RETURNING id;`,
        [room.id, owner.id],
      );
      const [session] = await dataSource.query<[{ id: string }]>(
        `INSERT INTO sessions (problem_id, title, date, order_index)
         VALUES ($1, 'Sessão 1', CURRENT_DATE, 1)
         RETURNING id;`,
        [problem.id],
      );
      await dataSource.query(
        `INSERT INTO attendances (session_id, student_id, recorded_by, status)
         VALUES ($1, $2, $3, 'PRESENT');`,
        [session.id, student.id, owner.id],
      );

      await api(app, student).delete(`/salas/${room.id}/membros/me`).expect(204);

      expect(await enrolledStudentCount(room.id)).toBe(0);

      const [attendance] = await dataSource.query<[{ count: string }]>(
        'SELECT COUNT(*)::text AS count FROM attendances WHERE session_id = $1 AND student_id = $2;',
        [session.id, student.id],
      );
      expect(Number(attendance.count)).toBe(1);
    });

    it('allows a co-tutor to leave voluntarily (204)', async () => {
      const room = await createRoom();

      await api(app, owner)
        .post(`/salas/${room.id}/professores`, { professorId: colleague.id })
        .expect(201);

      await api(app, colleague).delete(`/salas/${room.id}/membros/me`).expect(204);

      const [row] = await dataSource.query<[{ count: string }]>(
        'SELECT COUNT(*)::text AS count FROM room_tutors WHERE room_id = $1 AND tutor_id = $2;',
        [room.id, colleague.id],
      );
      expect(Number(row.count)).toBe(0);
    });

    it('prevents the responsible tutor (owner) from leaving with 409 Conflict', async () => {
      const room = await createRoom();

      const response = await api(app, owner).delete(`/salas/${room.id}/membros/me`).expect(409);

      expect(response.body).toEqual({
        statusCode: 409,
        message:
          'O professor responsável não pode sair da turma. Transfira a responsabilidade ou exclua a sala.',
        error: 'Conflict',
      });

      const [roomRow] = await dataSource.query<[{ tutor_id: string }]>(
        'SELECT tutor_id FROM rooms WHERE id = $1;',
        [room.id],
      );
      expect(roomRow.tutor_id).toBe(owner.id);
    });

    it('returns 403 Forbidden when an unlinked user tries to leave', async () => {
      const room = await createRoom();
      const outsider = await insertUser(app, dataSource, 'outsider@uefs.br', UserType.STUDENT);

      await api(app, outsider).delete(`/salas/${room.id}/membros/me`).expect(403);
    });

    it('returns 404 Not Found when trying to leave a non-existent or deleted room', async () => {
      await api(app, student).delete(`/salas/${MISSING_ID}/membros/me`).expect(404);

      const room = await createRoom();
      await api(app, owner).delete(`/salas/${room.id}`).expect(204);

      await api(app, student).delete(`/salas/${room.id}/membros/me`).expect(404);
    });

    it('returns 401 Unauthorized without auth token', async () => {
      const room = await createRoom();

      await api(app).delete(`/salas/${room.id}/membros/me`).expect(401);
    });
  });

  it('limits shared code and link attempts with a standardized 429 response', async () => {
    const enterWithInvalidCode = () =>
      api(app, student).post('/salas/ingressar/codigo', { codigoSala: 'invalid1' });

    for (let attempt = 0; attempt < 5; attempt++) {
      await enterWithInvalidCode().expect(404);
    }

    await api(app, student)
      .post('/salas/ingressar/link', { link: 'https://pbl360.com/salas/Ab12Cd34' })
      .expect(429, {
        statusCode: 429,
        message: 'Muitas tentativas de ingresso. Aguarde um minuto e tente novamente.',
        error: 'Too Many Requests',
      });
  });
});
