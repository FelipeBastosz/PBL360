import type { INestApplication } from '@nestjs/common';
import type { DataSource } from 'typeorm';
import { SYSTEM_TABLE_IDS } from '@/performance-tables/domain/entities/system-performance-tables';
import { UserType } from '@/users/domain/enums/user-type.enum';
import { api, insertUser, type TestUser } from './fixtures';

export interface ClassReportFixture {
  owner: TestUser;
  coTutor: TestUser;
  outsider: TestUser;
  student: TestUser;
  pendingStudent: TestUser;
  roomId: string;
  criterionIds: string[];
}

async function insertReportRoom(dataSource: DataSource, tutorId: string): Promise<string> {
  const [room] = await dataSource.query<[{ id: string }]>(
    `INSERT INTO rooms (tutor_id, name, course_code, room_code, semester)
     VALUES ($1, 'Turma de exportação', 'MED101', 'EXPORT383', '2026.2') RETURNING id;`,
    [tutorId],
  );
  return room.id;
}

async function enrollReportMembers(
  dataSource: DataSource,
  fixture: ClassReportFixture,
): Promise<void> {
  await dataSource.query('INSERT INTO room_tutors (room_id, tutor_id) VALUES ($1, $2)', [
    fixture.roomId,
    fixture.coTutor.id,
  ]);
  await dataSource.query(
    'INSERT INTO room_students (room_id, student_id) VALUES ($1, $2), ($1, $3)',
    [fixture.roomId, fixture.student.id, fixture.pendingStudent.id],
  );
  await dataSource.query("UPDATE users SET name = 'Ana Souza' WHERE id = $1", [fixture.student.id]);
  await dataSource.query("UPDATE users SET name = 'Bruno Lima' WHERE id = $1", [
    fixture.pendingStudent.id,
  ]);
}

async function createReportUsers(
  app: INestApplication,
  dataSource: DataSource,
): Promise<Omit<ClassReportFixture, 'roomId' | 'criterionIds'>> {
  const owner = await insertUser(app, dataSource, 'report.owner@uefs.br');
  const coTutor = await insertUser(app, dataSource, 'report.cotutor@uefs.br');
  const outsider = await insertUser(app, dataSource, 'report.outsider@uefs.br');
  const student = await insertUser(app, dataSource, '00000001@discente.uefs.br', UserType.STUDENT);
  const pendingStudent = await insertUser(
    app,
    dataSource,
    '00000002@discente.uefs.br',
    UserType.STUDENT,
  );
  return { owner, coTutor, outsider, student, pendingStudent };
}

export async function createClassReportFixture(
  app: INestApplication,
  dataSource: DataSource,
): Promise<ClassReportFixture> {
  const users = await createReportUsers(app, dataSource);
  const roomId = await insertReportRoom(dataSource, users.owner.id);
  const criteria = await dataSource.query<Array<{ id: string }>>(
    'SELECT id FROM performance_criteria WHERE performance_table_id = $1 ORDER BY order_index',
    [SYSTEM_TABLE_IDS.standard],
  );
  const fixture = {
    ...users,
    roomId,
    criterionIds: criteria.map((item) => item.id),
  };
  await enrollReportMembers(dataSource, fixture);
  return fixture;
}

async function insertReportProblem(
  dataSource: DataSource,
  fixture: ClassReportFixture,
  order: number,
): Promise<string> {
  const [problem] = await dataSource.query<[{ id: string }]>(
    `INSERT INTO problems (room_id, title, order_index, created_by)
     VALUES ($1, $2, $3, $4) RETURNING id;`,
    [
      fixture.roomId,
      `Problema ${order} - Investigação clínica e discussão das hipóteses`,
      order,
      fixture.owner.id,
    ],
  );
  return problem.id;
}

async function insertReportSession(dataSource: DataSource, problemId: string): Promise<string> {
  const [session] = await dataSource.query<[{ id: string }]>(
    `INSERT INTO sessions (problem_id, performance_table_id, title, date, order_index)
     VALUES ($1, $2, 'Sessão de avaliação', '2026-10-01', 1) RETURNING id;`,
    [problemId, SYSTEM_TABLE_IDS.standard],
  );
  return session.id;
}

export async function saveReportEvaluation(
  app: INestApplication,
  fixture: ClassReportFixture,
  sessionId: string,
  score: number,
  justification?: string,
): Promise<void> {
  await api(app, fixture.owner)
    .put(`/sessoes/${sessionId}/avaliacoes/${fixture.student.id}`, {
      itens: fixture.criterionIds.map((criterionId) => ({ criterioId: criterionId, nota: score })),
      enviar: true,
      ...(justification ? { justificativa: justification } : {}),
    })
    .expect(200);
}

export async function createReportProblem(
  app: INestApplication,
  dataSource: DataSource,
  fixture: ClassReportFixture,
  order: number,
  score: number | null,
): Promise<{ id: string; sessionId: string }> {
  const id = await insertReportProblem(dataSource, fixture, order);
  const sessionId = await insertReportSession(dataSource, id);
  if (score !== null) await saveReportEvaluation(app, fixture, sessionId, score);
  return { id, sessionId };
}
