import { Logger } from '@nestjs/common';
import type { DataSource, Repository } from 'typeorm';
import { User } from '@/users/domain/entities/user.entity';
import {
  type ReviewUsers,
  seedReviewBehaviorTagsAndObservations,
  seedReviewCriterionGrades,
  seedReviewFeedbacksIfEmpty,
} from './review-activities.seed';
import { seedReviewProblem, seedReviewSessions } from './review-sessions.seed';

const logger = new Logger('ReviewSeed');

async function findStudent(
  repo: Repository<User>,
  email: string,
  reg: string,
): Promise<User | null> {
  const byEmail = await repo.findOneBy({ email });
  if (byEmail) return byEmail;
  return repo.findOneBy({ registrationNumber: reg });
}

async function findReviewUsers(ds: DataSource): Promise<ReviewUsers | null> {
  const repo = ds.getRepository(User);
  const tutor = await repo.findOneBy({ email: 'carlos@uefs.br' });
  const coTutor = await repo.findOneBy({ email: 'maria@uefs.br' });
  const student1 = await findStudent(repo, '20240001@discente.uefs.br', '20240001');
  const student2 = await findStudent(repo, '20240002@discente.uefs.br', '20240002');
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

async function seedReviewRoles(
  ds: DataSource,
  sessionIds: [string, string],
  users: ReviewUsers,
): Promise<void> {
  const [s1, s2] = sessionIds;
  await ds.query(
    `INSERT INTO session_roles (session_id, student_id, role, role_score)
     VALUES ($1, $2, 'COORDINATOR', 5.0), ($1, $3, 'TABLE_SECRETARY', 5.0)
     ON CONFLICT (session_id, student_id) DO UPDATE SET role = EXCLUDED.role, role_score = EXCLUDED.role_score;`,
    [s1, users.student1.id, users.student2.id],
  );
  await ds.query(
    `INSERT INTO session_roles (session_id, student_id, role, role_score)
     VALUES ($1, $2, 'TABLE_SECRETARY', 5.0), ($1, $3, 'COORDINATOR', 5.0)
     ON CONFLICT (session_id, student_id) DO UPDATE SET role = EXCLUDED.role, role_score = EXCLUDED.role_score;`,
    [s2, users.student1.id, users.student2.id],
  );
}

async function seedSession1Attendance(
  ds: DataSource,
  s1: string,
  users: ReviewUsers,
): Promise<void> {
  await ds.query(
    `INSERT INTO attendances (session_id, student_id, recorded_by, status, seat_number)
     VALUES ($1, $2, $4, 'PRESENT', 1), ($1, $3, $4, 'PRESENT', 2)
     ON CONFLICT (session_id, student_id) DO UPDATE
     SET status = EXCLUDED.status, seat_number = EXCLUDED.seat_number, justification = NULL;`,
    [s1, users.student1.id, users.student2.id, users.tutor.id],
  );
}

async function seedSession2Attendance(
  ds: DataSource,
  s2: string,
  users: ReviewUsers,
): Promise<void> {
  await ds.query(
    `INSERT INTO attendances (session_id, student_id, recorded_by, status, seat_number, justification)
     VALUES ($1, $2, $4, 'PRESENT', 1, NULL),
            ($1, $3, $4, 'EXCUSED', NULL, 'Participação em congresso acadêmico')
     ON CONFLICT (session_id, student_id) DO UPDATE
     SET status = EXCLUDED.status, seat_number = EXCLUDED.seat_number, justification = EXCLUDED.justification;`,
    [s2, users.student1.id, users.student2.id, users.tutor.id],
  );
}

async function seedReviewAttendances(
  ds: DataSource,
  sessionIds: [string, string],
  users: ReviewUsers,
): Promise<void> {
  await seedSession1Attendance(ds, sessionIds[0], users);
  await seedSession2Attendance(ds, sessionIds[1], users);
}

export async function seedReviewData(ds: DataSource): Promise<void> {
  const users = await findReviewUsers(ds);
  if (!users) {
    logger.warn('Users not found for review seed. Skipping.');
    return;
  }
  const roomId = await findOrCreateReviewRoom(ds, users.tutor.id);
  await associateReviewRoomMembers(ds, roomId, users);
  const { problemId, tableId } = await seedReviewProblem(ds, roomId, users.tutor.id);
  const sessions = await seedReviewSessions(ds, problemId, tableId, users.tutor.id);
  await seedReviewActivities(ds, problemId, sessions, users);
  logger.log('Review seed completed successfully.');
}

async function seedReviewActivities(
  ds: DataSource,
  problemId: string,
  sessions: [string, string],
  users: ReviewUsers,
): Promise<void> {
  await seedReviewAttendances(ds, sessions, users);
  await seedReviewRoles(ds, sessions, users);
  await seedReviewBehaviorTagsAndObservations(ds, sessions[0], users);
  await seedReviewCriterionGrades(ds, sessions, users);
  await seedReviewFeedbacksIfEmpty(ds, problemId, sessions[0], users);
}
