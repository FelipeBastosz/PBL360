import type { INestApplication } from '@nestjs/common';
import type { DataSource } from 'typeorm';
import { SYSTEM_TABLE_IDS } from '@/performance-tables/domain/entities/system-performance-tables';
import { UserType } from '@/users/domain/enums/user-type.enum';
import { insertUser, type TestUser } from './fixtures';

export interface DeletionFixture {
  owner: TestUser;
  student: TestUser;
  roomId: string;
  problemId: string;
}

export async function createDeletionFixture(
  app: INestApplication,
  db: DataSource,
): Promise<DeletionFixture> {
  const owner = await insertUser(app, db, 'owner417@test.local');
  const student = await insertUser(app, db, 'student417@test.local', UserType.STUDENT);
  const roomId = await insertDeletionRoom(db, owner.id, student.id);
  const [problem] = await db.query<[{ id: string }]>(
    `INSERT INTO problems (room_id, title, order_index, created_by)
     VALUES ($1, 'Problema 417', 1, $2) RETURNING id;`,
    [roomId, owner.id],
  );
  return { owner, student, roomId, problemId: problem.id };
}

async function insertDeletionRoom(
  db: DataSource,
  ownerId: string,
  studentId: string,
): Promise<string> {
  const [room] = await db.query<[{ id: string }]>(
    `INSERT INTO rooms (tutor_id, name, course_code, room_code, semester)
     VALUES ($1, 'Turma 417', 'MED417', 'ROOM417', '2026.2') RETURNING id;`,
    [ownerId],
  );
  await db.query('INSERT INTO room_students (room_id, student_id) VALUES ($1, $2)', [
    room.id,
    studentId,
  ]);
  return room.id;
}

export async function insertDeletionSession(db: DataSource, problemId: string): Promise<string> {
  const [session] = await db.query<[{ id: string }]>(
    `INSERT INTO sessions (problem_id, title, date, order_index, performance_table_id)
     SELECT $1, 'Sessão 417', '2026-10-15', COALESCE(MAX(order_index), 0) + 1, $2
     FROM sessions WHERE problem_id = $1 RETURNING id;`,
    [problemId, SYSTEM_TABLE_IDS.firstSession],
  );
  return session.id;
}

export async function insertDeletionFeedback(
  db: DataSource,
  fixture: DeletionFixture,
  sessionId: string | null = null,
): Promise<string> {
  const [feedback] = await db.query<[{ id: string }]>(
    `INSERT INTO feedback (autor_id, problema_id, destinatario_id, sessao_id, escopo, texto)
     VALUES ($1, $2, $3, $4, $5, 'Feedback preservado') RETURNING id;`,
    [
      fixture.owner.id,
      fixture.problemId,
      sessionId ? fixture.student.id : null,
      sessionId,
      sessionId ? 'SESSAO' : 'PROBLEMA',
    ],
  );
  return feedback.id;
}

export async function insertDeletionEvaluation(
  db: DataSource,
  fixture: DeletionFixture,
  sessionId: string,
): Promise<void> {
  const { owner, student, problemId } = fixture;
  await db.query(
    `INSERT INTO session_evaluation_configs (session_id, performance_table_id, table_name, created_by)
     VALUES ($1, $2, 'Padrão da 1ª sessão', $3) ON CONFLICT DO NOTHING;`,
    [sessionId, SYSTEM_TABLE_IDS.firstSession, owner.id],
  );
  await db.query(
    `INSERT INTO evaluations (evaluator_id, student_id, problem_id, session_id, config_session_id, performance_table_id, type, created_by)
     VALUES ($1, $2, $3, $4, $4, $5, 'TUTOR_SESSION', $1);`,
    [owner.id, student.id, problemId, sessionId, SYSTEM_TABLE_IDS.firstSession],
  );
}

export async function insertSessionActivity(
  db: DataSource,
  fixture: DeletionFixture,
  sessionId: string,
): Promise<void> {
  await db.query(
    `INSERT INTO attendances (session_id, student_id, recorded_by, status) VALUES ($1, $2, $3, 'PRESENT');`,
    [sessionId, fixture.student.id, fixture.owner.id],
  );
  await db.query(
    `INSERT INTO session_roles (session_id, student_id, role) VALUES ($1, $2, 'COORDINATOR');`,
    [sessionId, fixture.student.id],
  );
  await db.query(
    'INSERT INTO observations (session_id, student_id, author_id, text) VALUES ($1, $2, $3, $4);',
    [sessionId, fixture.student.id, fixture.owner.id, 'Observação preservada'],
  );
}
