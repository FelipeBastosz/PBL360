import { Logger } from '@nestjs/common';
import type { DataSource } from 'typeorm';
import { User } from '@/users/domain/entities/user.entity';

const logger = new Logger('ReviewSeed');

interface ReviewUsers {
  tutor: User;
  coTutor: User;
  student1: User;
  student2: User;
}

async function findReviewUsers(ds: DataSource): Promise<ReviewUsers | null> {
  const repo = ds.getRepository(User);
  const [tutor, coTutor, student1, student2] = await Promise.all([
    repo.findOneBy({ email: 'carlos@uefs.br' }),
    repo.findOneBy({ email: 'maria@uefs.br' }),
    repo.findOneBy({ email: '20240001@discente.uefs.br' }),
    repo.findOneBy({ email: '20240002@discente.uefs.br' }),
  ]);
  if (!tutor || !coTutor || !student1 || !student2) return null;
  return { tutor, coTutor, student1, student2 };
}

async function findOrCreateReviewRoom(ds: DataSource, tutorId: string): Promise<string> {
  const existing = await ds.query<Array<{ id: string }>>(
    `SELECT id FROM rooms WHERE course_code = 'EXA123' AND name = 'Engenharia de Software - Turma A' LIMIT 1;`,
  );
  if (existing[0]?.id) return existing[0].id;

  const created = await ds.query<Array<{ id: string }>>(
    `INSERT INTO rooms (tutor_id, name, course_code, room_code, semester, active)
     VALUES ($1, 'Engenharia de Software - Turma A', 'EXA123', 'ROOM2026A', '2026.2', true)
     RETURNING id;`,
    [tutorId],
  );
  return created[0]?.id ?? '';
}

async function associateReviewRoomMembers(
  ds: DataSource,
  roomId: string,
  users: ReviewUsers,
): Promise<void> {
  await ds.query(
    `INSERT INTO room_tutors (room_id, tutor_id) VALUES ($1, $2) ON CONFLICT DO NOTHING;`,
    [roomId, users.coTutor.id],
  );
  await ds.query(
    `INSERT INTO room_students (room_id, student_id) VALUES ($1, $2), ($1, $3) ON CONFLICT DO NOTHING;`,
    [roomId, users.student1.id, users.student2.id],
  );
}

async function seedReviewProblem(ds: DataSource, roomId: string, tutorId: string): Promise<string> {
  const table = await ds.query<Array<{ id: string }>>(
    `SELECT id FROM performance_tables WHERE name = 'Barema PBL' AND deleted_at IS NULL LIMIT 1;`,
  );
  const existing = await ds.query<Array<{ id: string }>>(
    `SELECT id FROM problems WHERE room_id = $1 AND title = 'Problema 1 - Prontuário Eletrônico' LIMIT 1;`,
    [roomId],
  );
  if (existing[0]?.id) return existing[0].id;

  const created = await ds.query<Array<{ id: string }>>(
    `INSERT INTO problems (room_id, title, description, order_index, performance_table_id, created_by)
     VALUES ($1, 'Problema 1 - Prontuário Eletrônico', 'Desenvolvimento de prontuário com PBL.', 1, $2, $3)
     RETURNING id;`,
    [roomId, table[0]?.id ?? null, tutorId],
  );
  return created[0]?.id ?? '';
}

async function seedSession(
  ds: DataSource,
  problemId: string,
  orderIndex: number,
  title: string,
  date: string,
  status: string,
): Promise<string> {
  const existing = await ds.query<Array<{ id: string }>>(
    `SELECT id FROM sessions WHERE problem_id = $1 AND order_index = $2 LIMIT 1;`,
    [problemId, orderIndex],
  );
  if (existing[0]?.id) return existing[0].id;

  const created = await ds.query<Array<{ id: string }>>(
    `INSERT INTO sessions (problem_id, title, description, date, order_index, status)
     VALUES ($1, $2, $2, $3, $4, $5) RETURNING id;`,
    [problemId, title, date, orderIndex, status],
  );
  return created[0]?.id ?? '';
}

async function seedReviewRoles(
  ds: DataSource,
  sessionIds: [string, string],
  users: ReviewUsers,
): Promise<void> {
  const [s1, s2] = sessionIds;
  await ds.query(
    `INSERT INTO session_roles (session_id, student_id, role, bonus_score)
     VALUES ($1, $2, 'COORDINATOR', 0.5), ($1, $3, 'TABLE_SECRETARY', 0.5)
     ON CONFLICT (session_id, student_id) DO UPDATE SET role = EXCLUDED.role;`,
    [s1, users.student1.id, users.student2.id],
  );
  await ds.query(
    `INSERT INTO session_roles (session_id, student_id, role, bonus_score)
     VALUES ($1, $2, 'TABLE_SECRETARY', 0.5), ($1, $3, 'COORDINATOR', 0.5)
     ON CONFLICT (session_id, student_id) DO UPDATE SET role = EXCLUDED.role;`,
    [s2, users.student1.id, users.student2.id],
  );
}

async function seedSessionFeedbacks(
  ds: DataSource,
  problemId: string,
  session1Id: string,
  users: ReviewUsers,
): Promise<void> {
  await ds.query(
    `INSERT INTO feedback (autor_id, problema_id, destinatario_id, sessao_id, escopo, texto)
     VALUES ($1, $2, $3, $4, 'SESSAO', 'Excelente condução da abertura como coordenadora.'),
            ($1, $2, $5, $4, 'SESSAO', 'Relatório claro com registros precisos.');`,
    [users.tutor.id, problemId, users.student1.id, session1Id, users.student2.id],
  );
}

async function seedProblemFeedbacks(
  ds: DataSource,
  problemId: string,
  users: ReviewUsers,
): Promise<void> {
  await ds.query(
    `INSERT INTO feedback (autor_id, problema_id, destinatario_id, escopo, nota, texto)
     VALUES ($1, $2, $3, 'ALUNO', 9.5, 'Desempenho excelente durante todas as discussões.'),
            ($1, $2, $4, 'ALUNO', 9.0, 'Ótima capacidade analítica e postura colaborativa.');`,
    [users.tutor.id, problemId, users.student1.id, users.student2.id],
  );
  await ds.query(
    `INSERT INTO feedback (autor_id, problema_id, escopo, texto)
     VALUES ($1, $2, 'PROBLEMA', 'A turma demonstrou maturidade na resolução do problema.');`,
    [users.tutor.id, problemId],
  );
}

async function seedReviewFeedbacksIfEmpty(
  ds: DataSource,
  problemId: string,
  s1: string,
  users: ReviewUsers,
): Promise<void> {
  const existingFb = await ds.query<Array<{ id: string }>>(
    `SELECT id FROM feedback WHERE problema_id = $1 LIMIT 1;`,
    [problemId],
  );
  if (existingFb.length === 0) {
    await seedSessionFeedbacks(ds, problemId, s1, users);
    await seedProblemFeedbacks(ds, problemId, users);
  }
}

export async function seedReviewData(ds: DataSource): Promise<void> {
  const users = await findReviewUsers(ds);
  if (!users) {
    logger.warn('Users not found for review seed. Skipping.');
    return;
  }
  const roomId = await findOrCreateReviewRoom(ds, users.tutor.id);
  await associateReviewRoomMembers(ds, roomId, users);
  const problemId = await seedReviewProblem(ds, roomId, users.tutor.id);
  const s1 = await seedSession(ds, problemId, 1, 'Sessão 1 - Abertura', '2026-10-01', 'concluida');
  const s2 = await seedSession(ds, problemId, 2, 'Sessão 2 - Fechamento', '2026-10-08', 'agendada');
  await seedReviewRoles(ds, [s1, s2], users);
  await seedReviewFeedbacksIfEmpty(ds, problemId, s1, users);
  logger.log('Review seed completed successfully.');
}
