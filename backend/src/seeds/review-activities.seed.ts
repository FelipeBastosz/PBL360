import type { DataSource } from 'typeorm';
import type { User } from '@/users/domain/entities/user.entity';

export interface ReviewUsers {
  tutor: User;
  coTutor: User;
  student1: User;
  student2: User;
}

async function ensureReviewBehaviorTags(
  ds: DataSource,
  tutorId: string,
): Promise<Map<string, string>> {
  const tagNames = ['Liderança e Proatividade', 'Síntese e Clareza', 'Colaboração em Equipe'];
  for (const name of tagNames) {
    await ds.query(
      `INSERT INTO behavior_tags (tutor_id, name, active)
       VALUES ($1, $2, true) ON CONFLICT (tutor_id, name) DO NOTHING;`,
      [tutorId, name],
    );
  }
  const tags = await ds.query<Array<{ id: string; name: string }>>(
    `SELECT id, name FROM behavior_tags WHERE tutor_id = $1 AND name = ANY($2);`,
    [tutorId, tagNames],
  );
  return new Map(tags.map((t) => [t.name, t.id]));
}

async function insertReviewStudentObservation(
  ds: DataSource,
  session1Id: string,
  studentId: string,
  tutorId: string,
  text: string,
  tagId?: string,
): Promise<void> {
  const obs = await ds.query<Array<{ id: string }>>(
    `INSERT INTO observations (session_id, student_id, author_id, text)
     VALUES ($1, $2, $3, $4) RETURNING id;`,
    [session1Id, studentId, tutorId, text],
  );
  if (obs[0]?.id && tagId) {
    await ds.query(
      `INSERT INTO observation_tags (observation_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING;`,
      [obs[0].id, tagId],
    );
  }
}

const OBS_TEMPLATES = [
  {
    isStudent1: true,
    tag: 'Liderança e Proatividade',
    text: 'Demonstrou excelente capacidade de articulação e condução da discussão como coordenadora.',
  },
  {
    isStudent1: false,
    tag: 'Síntese e Clareza',
    text: 'Sistematizou o mapa conceitual com alto nível de detalhe técnico como secretário.',
  },
];

async function insertSession1Observations(
  ds: DataSource,
  s1Id: string,
  users: ReviewUsers,
  tags: Map<string, string>,
): Promise<void> {
  for (const t of OBS_TEMPLATES) {
    const studentId = t.isStudent1 ? users.student1.id : users.student2.id;
    await insertReviewStudentObservation(
      ds,
      s1Id,
      studentId,
      users.tutor.id,
      t.text,
      tags.get(t.tag),
    );
  }
}

export async function seedReviewBehaviorTagsAndObservations(
  ds: DataSource,
  session1Id: string,
  users: ReviewUsers,
): Promise<void> {
  const tagMap = await ensureReviewBehaviorTags(ds, users.tutor.id);
  const existingObs = await ds.query<Array<{ id: string }>>(
    `SELECT id FROM observations WHERE session_id = $1 LIMIT 1;`,
    [session1Id],
  );
  if (existingObs.length === 0) {
    await insertSession1Observations(ds, session1Id, users, tagMap);
  }
}

async function saveCriterionScoresForSessions(
  ds: DataSource,
  sessionIds: [string, string],
  users: ReviewUsers,
  criterionId: string,
): Promise<void> {
  const [s1, s2] = sessionIds;
  await ds.query(
    `INSERT INTO criterion_grades (session_id, student_id, criterion_id, score)
     VALUES ($1, $2, $3, 9.0), ($1, $4, $3, 8.5)
     ON CONFLICT (session_id, student_id, criterion_id) DO UPDATE SET score = EXCLUDED.score;`,
    [s1, users.student1.id, criterionId, users.student2.id],
  );
  await ds.query(
    `INSERT INTO criterion_grades (session_id, student_id, criterion_id, score)
     VALUES ($1, $2, $3, 9.5)
     ON CONFLICT (session_id, student_id, criterion_id) DO UPDATE SET score = EXCLUDED.score;`,
    [s2, users.student1.id, criterionId],
  );
}

export async function seedReviewCriterionGrades(
  ds: DataSource,
  problemId: string,
  sessionIds: [string, string],
  users: ReviewUsers,
): Promise<void> {
  const criteria = await ds.query<Array<{ id: string; name: string }>>(
    `SELECT pc.id, pc.name
     FROM performance_criteria pc
     JOIN problems p ON p.performance_table_id = pc.performance_table_id
     WHERE p.id = $1 ORDER BY pc.order_index ASC;`,
    [problemId],
  );
  for (const criterion of criteria) {
    await saveCriterionScoresForSessions(ds, sessionIds, users, criterion.id);
  }
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

export async function seedReviewFeedbacksIfEmpty(
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
