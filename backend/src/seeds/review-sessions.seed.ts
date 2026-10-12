import type { DataSource } from 'typeorm';

export async function seedReviewProblem(
  ds: DataSource,
  roomId: string,
  tutorId: string,
): Promise<{ problemId: string; tableId: string }> {
  return {
    problemId: await findOrCreateReviewProblem(ds, roomId, tutorId),
    tableId: await findReviewTableId(ds, roomId),
  };
}

async function findReviewTableId(ds: DataSource, roomId: string): Promise<string> {
  const [table] = await ds.query<Array<{ id: string }>>(
    `SELECT pt.id
       FROM performance_tables pt
       JOIN rooms r ON r.id = $1 AND r.tutor_id = pt.tutor_id
      WHERE pt.name = 'Barema PBL' AND pt.deleted_at IS NULL
      LIMIT 1;`,
    [roomId],
  );
  if (!table?.id) throw new Error('A tabela Barema PBL não está disponível para a turma.');
  return table.id;
}

async function findOrCreateReviewProblem(
  ds: DataSource,
  roomId: string,
  tutorId: string,
): Promise<string> {
  const existing = await ds.query<Array<{ id: string }>>(
    `SELECT id FROM problems WHERE room_id = $1 AND title = 'Problema 1 - Prontuário Eletrônico' LIMIT 1;`,
    [roomId],
  );
  if (existing[0]?.id) return existing[0].id;
  const [created] = await ds.query<Array<{ id: string }>>(
    `INSERT INTO problems (room_id, title, description, order_index, created_by)
     VALUES ($1, 'Problema 1 - Prontuário Eletrônico', 'Desenvolvimento de prontuário com PBL.', 1, $2)
     RETURNING id;`,
    [roomId, tutorId],
  );
  if (!created?.id) throw new Error('Falha ao criar o problema de revisão.');
  return created.id;
}

export async function seedReviewSessions(
  ds: DataSource,
  problemId: string,
  tableId: string,
  tutorId: string,
): Promise<[string, string]> {
  const shared = { ds, problemId, tableId, tutorId };
  const first = await seedSession(reviewSessionInput(shared, 1));
  const second = await seedSession(reviewSessionInput(shared, 2));
  return [first, second];
}

function reviewSessionInput(
  shared: { ds: DataSource; problemId: string; tableId: string; tutorId: string },
  orderIndex: 1 | 2,
) {
  return {
    ...shared,
    orderIndex,
    title: orderIndex === 1 ? 'Sessão 1 - Abertura' : 'Sessão 2 - Fechamento',
    date: orderIndex === 1 ? '2026-10-01' : '2026-10-08',
    status: orderIndex === 1 ? 'concluida' : 'agendada',
  };
}

async function seedSession(input: {
  ds: DataSource;
  problemId: string;
  tableId: string;
  tutorId: string;
  orderIndex: number;
  title: string;
  date: string;
  status: string;
}): Promise<string> {
  const existingId = await findSessionId(input.ds, input.problemId, input.orderIndex);
  if (existingId) {
    await ensureDefaultSessionFormula(input.ds, existingId, input.tutorId);
    return existingId;
  }
  const sessionId = await insertSession(input);
  await ensureDefaultSessionFormula(input.ds, sessionId, input.tutorId);
  return sessionId;
}

async function findSessionId(
  ds: DataSource,
  problemId: string,
  orderIndex: number,
): Promise<string | null> {
  const [row] = await ds.query<Array<{ id: string }>>(
    `SELECT id FROM sessions WHERE problem_id = $1 AND order_index = $2 LIMIT 1;`,
    [problemId, orderIndex],
  );
  return row?.id ?? null;
}

async function insertSession(input: {
  ds: DataSource;
  problemId: string;
  tableId: string;
  orderIndex: number;
  title: string;
  date: string;
  status: string;
}): Promise<string> {
  const [row] = await input.ds.query<Array<{ id: string }>>(
    INSERT_REVIEW_SESSION,
    sessionParameters(input),
  );
  if (!row?.id) throw new Error('Falha ao criar uma sessão de revisão.');
  return row.id;
}

const INSERT_REVIEW_SESSION = `INSERT INTO sessions
  (problem_id, performance_table_id, title, description, date, order_index, status)
  VALUES ($1, $7, $2, $3, $4, $5, $6) RETURNING id;`;

function sessionParameters(input: {
  problemId: string;
  tableId: string;
  orderIndex: number;
  title: string;
  date: string;
  status: string;
}) {
  return [
    input.problemId,
    input.title,
    input.title,
    input.date,
    input.orderIndex,
    input.status,
    input.tableId,
  ];
}

async function ensureDefaultSessionFormula(
  ds: DataSource,
  sessionId: string,
  tutorId: string,
): Promise<void> {
  if (await hasActiveSessionFormula(ds, sessionId)) return;
  const formulaId = await insertDefaultSessionFormula(ds, sessionId, tutorId);
  await ds.query(
    `INSERT INTO formula_components (formula_id, type, weight)
     VALUES ($1, 'CRITERIOS', 70), ($1, 'PAPEL', 30);`,
    [formulaId],
  );
}

async function hasActiveSessionFormula(ds: DataSource, sessionId: string): Promise<boolean> {
  const [row] = await ds.query<Array<{ id: string }>>(
    `SELECT id FROM formulas WHERE session_id = $1 AND scope = 'SESSAO' AND active = TRUE;`,
    [sessionId],
  );
  return Boolean(row);
}

async function insertDefaultSessionFormula(
  ds: DataSource,
  sessionId: string,
  tutorId: string,
): Promise<string> {
  const [formula] = await ds.query<Array<{ id: string }>>(
    `INSERT INTO formulas (session_id, scope, version, active, is_default, created_by)
     VALUES ($1, 'SESSAO', 1, TRUE, TRUE, $2) RETURNING id;`,
    [sessionId, tutorId],
  );
  if (!formula?.id) throw new Error('Falha ao criar a fórmula padrão da sessão de revisão.');
  return formula.id;
}
