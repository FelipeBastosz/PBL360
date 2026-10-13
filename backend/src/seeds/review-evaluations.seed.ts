import type { DataSource } from 'typeorm';
import type { ReviewUsers } from './review-activities.seed';

interface CriterionRow {
  id: string;
}

interface SeedContext {
  ds: DataSource;
  problemId: string;
  sessionId: string;
  tableId: string;
  criteria: CriterionRow[];
}

const SELF_SQL = `INSERT INTO evaluations (evaluator_id, student_id, problem_id, session_id, config_session_id, performance_table_id, type, status, submitted_at, session_score, calculation_version, created_by)
VALUES ($1, $1, $2, $3, $3, $4, 'SELF_ASSESSMENT', 'SUBMITTED', now(), $5, 'WEIGHTED_SESSION_FORMULA_V3', $1)
RETURNING id;`;

const PEER_SQL = `INSERT INTO evaluations (evaluator_id, student_id, problem_id, session_id, config_session_id, performance_table_id, type, status, submitted_at, session_score, calculation_version, created_by)
VALUES ($1, $2, $3, $4, $4, $5, 'PEER_ASSESSMENT', 'SUBMITTED', now(), 8.5, 'WEIGHTED_SESSION_FORMULA_V3', $1)
RETURNING id;`;

async function findSessionCriteria(ds: DataSource, sessionId: string) {
  const [s] = await ds.query<Array<{ performance_table_id: string }>>(
    `SELECT performance_table_id FROM sessions WHERE id = $1;`,
    [sessionId],
  );
  if (!s) return null;
  const criteria = await ds.query<CriterionRow[]>(
    `SELECT id FROM performance_criteria WHERE performance_table_id = $1 AND deleted_at IS NULL ORDER BY order_index;`,
    [s.performance_table_id],
  );
  return criteria.length ? { tableId: s.performance_table_id, criteria } : null;
}

async function insertItems(
  ds: DataSource,
  evalId: string,
  criteria: CriterionRow[],
  score: number,
) {
  for (const c of criteria) {
    await ds.query(
      `INSERT INTO evaluation_items (evaluation_id, criterion_id, score) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING;`,
      [evalId, c.id, score],
    );
  }
}

async function seedStudentSelf(ctx: SeedContext, userId: string, score: number) {
  const [row] = await ctx.ds.query<Array<{ id: string }>>(SELF_SQL, [
    userId,
    ctx.problemId,
    ctx.sessionId,
    ctx.tableId,
    score,
  ]);
  if (row?.id) await insertItems(ctx.ds, row.id, ctx.criteria, score);
  return row?.id;
}

async function seedPeer(ctx: SeedContext, evaluatorId: string, targetId: string) {
  const [peer] = await ctx.ds.query<Array<{ id: string }>>(PEER_SQL, [
    evaluatorId,
    targetId,
    ctx.problemId,
    ctx.sessionId,
    ctx.tableId,
  ]);
  if (peer?.id) await insertItems(ctx.ds, peer.id, ctx.criteria, 8.5);
}

async function addAdjustment(ds: DataSource, evalId: string, tutorId: string) {
  await ds.query(
    `INSERT INTO grade_adjustments (evaluation_id, previous_value, new_value, justification, created_by, created_at)
VALUES ($1, 8.5, 9.0, 'Ajuste apos validacao da participacao ativa e lideranca.', $2, now());`,
    [evalId, tutorId],
  );
}

async function seedStudentsAndPeers(ctx: SeedContext, users: ReviewUsers) {
  const self1 = await seedStudentSelf(ctx, users.student1.id, 8.5);
  if (self1) await addAdjustment(ctx.ds, self1, users.tutor.id);
  await seedStudentSelf(ctx, users.student2.id, 8.0);
  await seedPeer(ctx, users.student2.id, users.student1.id);
  await seedPeer(ctx, users.student1.id, users.student2.id);
}

export async function seedReviewEvaluationsIfEmpty(
  ds: DataSource,
  problemId: string,
  sessionId: string,
  users: ReviewUsers,
): Promise<void> {
  const existing = await ds.query<Array<{ id: string }>>(
    `SELECT id FROM evaluations WHERE session_id = $1 LIMIT 1;`,
    [sessionId],
  );
  if (existing.length > 0) return;
  const config = await findSessionCriteria(ds, sessionId);
  if (!config) return;
  await seedStudentsAndPeers({ ds, problemId, sessionId, ...config }, users);
}
