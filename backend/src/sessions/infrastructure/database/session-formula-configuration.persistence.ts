import type { DataSource, EntityManager } from 'typeorm';
import type { SessionConfigRow } from './session-table-configuration.persistence';
import { SessionFormulaComponentType } from '../../application/dtos/session-evaluation-configuration.dto';

export interface PersistedSessionFormulaRow {
  isDefault: boolean;
  version: number;
  type: SessionFormulaComponentType;
  weight: string | number;
}

export interface FormulaComponentInput {
  type: SessionFormulaComponentType;
  weight: number;
}

export const DEFAULT_SESSION_FORMULA: FormulaComponentInput[] = [
  { type: SessionFormulaComponentType.CRITERIOS, weight: 70 },
  { type: SessionFormulaComponentType.PAPEL, weight: 30 },
];

export function readSessionFormula(
  manager: EntityManager,
  sessionId: string,
): Promise<PersistedSessionFormulaRow[]> {
  return manager.query<PersistedSessionFormulaRow[]>(
    `SELECT f.is_default AS "isDefault", f.version, fc.type, fc.weight
       FROM formulas f
       JOIN formula_components fc ON fc.formula_id = f.id
      WHERE f.session_id = $1 AND f.scope = 'SESSAO' AND f.active = TRUE
      ORDER BY fc.type;`,
    [sessionId],
  );
}

export function updateSessionFormula(
  dataSource: DataSource,
  current: SessionConfigRow,
  tutorId: string,
  components: FormulaComponentInput[],
  applyToFollowing: boolean,
) {
  return dataSource.transaction(async (manager) => {
    await manager.query('SELECT id FROM problems WHERE id = $1 FOR UPDATE;', [current.problemId]);
    const sessions = await findTargetSessions(manager, current, applyToFollowing);
    for (const session of sessions) {
      await persistFormula(manager, session.id, tutorId, components, false);
    }
  });
}

export function restoreSessionFormula(
  dataSource: DataSource,
  current: SessionConfigRow,
  tutorId: string,
) {
  return dataSource.transaction(async (manager) => {
    await manager.query('SELECT id FROM problems WHERE id = $1 FOR UPDATE;', [current.problemId]);
    await persistFormula(manager, current.id, tutorId, DEFAULT_SESSION_FORMULA, true);
  });
}

async function findTargetSessions(
  manager: EntityManager,
  current: SessionConfigRow,
  applyToFollowing: boolean,
): Promise<SessionConfigRow[]> {
  const operator = applyToFollowing ? '>=' : '=';
  return manager.query<SessionConfigRow[]>(
    `SELECT id, problem_id AS "problemId", order_index AS "orderIndex", title
       FROM sessions
      WHERE problem_id = $1 AND order_index ${operator} $2
      ORDER BY order_index
      FOR UPDATE;`,
    [current.problemId, current.orderIndex],
  );
}

async function persistFormula(
  manager: EntityManager,
  sessionId: string,
  tutorId: string,
  components: FormulaComponentInput[],
  isDefault: boolean,
): Promise<void> {
  await manager.query(
    `UPDATE formulas SET active = FALSE
      WHERE session_id = $1 AND scope = 'SESSAO' AND active = TRUE;`,
    [sessionId],
  );
  const version = await getNextVersion(manager, sessionId);
  const formulaId = await insertFormula(manager, sessionId, tutorId, version, isDefault);
  await insertFormulaComponents(manager, formulaId, components);
}

async function getNextVersion(manager: EntityManager, sessionId: string): Promise<number> {
  const [row] = await manager.query<Array<{ version: number }>>(
    `SELECT COALESCE(MAX(version), 0) + 1 AS version
       FROM formulas WHERE session_id = $1 AND scope = 'SESSAO';`,
    [sessionId],
  );
  return row?.version ?? 1;
}

async function insertFormula(
  manager: EntityManager,
  sessionId: string,
  tutorId: string,
  version: number,
  isDefault: boolean,
): Promise<string> {
  const [row] = await manager.query<Array<{ id: string }>>(
    `INSERT INTO formulas
       (session_id, scope, version, active, is_default, created_by)
     VALUES ($1, 'SESSAO', $2, TRUE, $3, $4)
     RETURNING id;`,
    [sessionId, version, isDefault, tutorId],
  );
  if (!row) throw new Error('Failed to persist the session formula.');
  return row.id;
}

async function insertFormulaComponents(
  manager: EntityManager,
  formulaId: string,
  components: FormulaComponentInput[],
): Promise<void> {
  for (const component of components) {
    await manager.query(
      `INSERT INTO formula_components (formula_id, type, reference_id, weight)
       VALUES ($1, $2, NULL, $3);`,
      [formulaId, component.type, component.weight],
    );
  }
}
