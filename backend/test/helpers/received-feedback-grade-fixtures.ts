import type { INestApplication } from '@nestjs/common';
import type { DataSource } from 'typeorm';
import { UserType } from '@/users/domain/enums/user-type.enum';
import { insertUser, type TestUser } from './fixtures';

export interface FeedbackGradeFixture {
  tutor: TestUser;
  student: TestUser;
  colleague: TestUser;
  outsider: TestUser;
  roomId: string;
  problemId: string;
  sessionId: string;
  otherSessionId: string;
  criteria: { id: string }[];
}

export async function createFeedbackGradeFixture(
  app: INestApplication,
  db: DataSource,
): Promise<FeedbackGradeFixture> {
  const users = await createUsers(app, db);
  const context = await createContext(db, users.tutor.id);
  await db.query('INSERT INTO room_students (room_id, student_id) VALUES ($1, $2), ($1, $3)', [
    context.roomId,
    users.student.id,
    users.colleague.id,
  ]);
  const { tableId, criteria } = await createTable(db, users.tutor.id);
  const sessions = await createSessions(db, context.problemId, tableId);
  return { ...users, ...context, ...sessions, criteria };
}

async function createUsers(app: INestApplication, db: DataSource) {
  const tutor = await insertUser(app, db, 'tutor445@uefs.br');
  const student = await insertUser(app, db, 'student445@discente.uefs.br', UserType.STUDENT);
  const colleague = await insertUser(app, db, 'colleague445@discente.uefs.br', UserType.STUDENT);
  const outsider = await insertUser(app, db, 'outsider445@discente.uefs.br', UserType.STUDENT);
  return { tutor, student, colleague, outsider };
}

async function createSessions(db: DataSource, problemId: string, tableId: string) {
  const sessions = await db.query<{ id: string }[]>(
    `INSERT INTO sessions (problem_id, performance_table_id, title, date, order_index)
     VALUES ($1, $2, 'S1', '2099-01-01', 1), ($1, $2, 'S2', '2099-01-02', 2) RETURNING id`,
    [problemId, tableId],
  );
  return { sessionId: sessions[0]!.id, otherSessionId: sessions[1]!.id };
}

async function createContext(db: DataSource, tutorId: string) {
  const [room] = await db.query<[{ id: string }]>(
    `INSERT INTO rooms (tutor_id, name, course_code, room_code, semester, active)
     VALUES ($1, 'Sala', 'EXA123', 'GRADE445', '2026.2', true) RETURNING id`,
    [tutorId],
  );
  const [problem] = await db.query<[{ id: string }]>(
    `INSERT INTO problems (room_id, title, order_index, created_by)
     VALUES ($1, 'Problema', 1, $2) RETURNING id`,
    [room.id, tutorId],
  );
  return { roomId: room.id, problemId: problem.id };
}

async function createTable(db: DataSource, tutorId: string) {
  const [table] = await db.query<[{ id: string }]>(
    "INSERT INTO performance_tables (tutor_id, name, is_default) VALUES ($1, 'Tabela', false) RETURNING id",
    [tutorId],
  );
  const criteria = await db.query<{ id: string }[]>(
    `INSERT INTO performance_criteria (performance_table_id, name, weight, order_index)
     VALUES ($1, 'Participação', 1, 1), ($1, 'Autonomia', 3, 2) RETURNING id`,
    [table.id],
  );
  return { tableId: table.id, criteria };
}

export const evaluationItems = (fixture: FeedbackGradeFixture, first = 7, second = 9) => [
  { criterioId: fixture.criteria[0]!.id, nota: first },
  { criterioId: fixture.criteria[1]!.id, nota: second },
];
