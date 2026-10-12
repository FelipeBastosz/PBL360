import { ConflictError, UnprocessableEntityError } from '@/shared/errors/application.error';
import type { DataSource, EntityManager } from 'typeorm';
import {
  removeObsoleteDraftItems,
  replaceSessionSnapshot,
} from './session-evaluation-snapshot.persistence';

export interface SessionConfigRow {
  id: string;
  problemId: string;
  orderIndex: number;
  title: string;
}

const FIND_VISIBLE_TABLE = `SELECT pt.id, pt.name, pt.is_default AS "isDefault"
       FROM performance_tables pt
      WHERE pt.id = $1 AND pt.deleted_at IS NULL
        AND EXISTS (
          SELECT 1 FROM rooms r
          LEFT JOIN room_tutors rt ON rt.room_id = r.id
          WHERE r.id = $2
            AND (pt.tutor_id = r.tutor_id OR pt.tutor_id = rt.tutor_id OR pt.tutor_id = $3)
        )
      FOR SHARE OF pt;`;

export interface SessionTableRow {
  id: string;
  name: string;
  isDefault: boolean;
}

export interface SessionCriterionRow {
  id: string;
  name: string;
  description: string | null;
  weight: string | number;
  orderIndex: number;
}

export function updateSessionTable(
  dataSource: DataSource,
  current: SessionConfigRow,
  tableId: string,
  roomId: string,
  tutorId: string,
  applyToFollowing: boolean,
) {
  return dataSource.transaction((manager) =>
    applyTableChange(manager, current, tableId, roomId, tutorId, applyToFollowing),
  );
}

async function applyTableChange(
  manager: EntityManager,
  current: SessionConfigRow,
  tableId: string,
  roomId: string,
  tutorId: string,
  applyToFollowing: boolean,
) {
  await manager.query('SELECT id FROM problems WHERE id = $1 FOR UPDATE;', [current.problemId]);
  const table = await findVisibleTable(manager, tableId, roomId, tutorId);
  if (!(await hasActiveCriteria(manager, tableId))) {
    throw new UnprocessableEntityError('A tabela informada não possui critérios ativos.');
  }
  const sessions = await findTargetSessions(manager, current, applyToFollowing);
  await rejectSubmittedCurrentSession(manager, current.id);
  return updateTargetSessions(manager, sessions, table);
}

async function hasActiveCriteria(manager: EntityManager, tableId: string): Promise<boolean> {
  const [row] = await manager.query<Array<{ exists: boolean }>>(
    `SELECT EXISTS (
       SELECT 1 FROM performance_criteria
        WHERE performance_table_id = $1 AND deleted_at IS NULL
     ) AS exists;`,
    [tableId],
  );
  return row?.exists ?? false;
}

async function findVisibleTable(
  manager: EntityManager,
  tableId: string,
  roomId: string,
  tutorId: string,
): Promise<SessionTableRow> {
  const [table] = await manager.query<SessionTableRow[]>(FIND_VISIBLE_TABLE, [
    tableId,
    roomId,
    tutorId,
  ]);
  if (!table) {
    throw new UnprocessableEntityError('A tabela está inativa ou não está disponível na turma.');
  }
  return table;
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

async function rejectSubmittedCurrentSession(manager: EntityManager, sessionId: string) {
  if (await hasSubmittedTutorEvaluation(manager, sessionId)) {
    throw new ConflictError('A sessão já possui avaliação do tutor enviada.');
  }
}

async function updateTargetSessions(
  manager: EntityManager,
  sessions: SessionConfigRow[],
  table: SessionTableRow,
) {
  const result = {
    sessoesAtualizadas: [] as Array<{ sessaoId: string; rotulo: string }>,
    sessoesIgnoradas: [] as Array<{ sessaoId: string; rotulo: string; motivo: string }>,
  };
  for (const session of sessions) {
    await updateOrSkipSession(manager, session, table, result);
  }
  return result;
}

async function updateOrSkipSession(
  manager: EntityManager,
  session: SessionConfigRow,
  table: SessionTableRow,
  result: {
    sessoesAtualizadas: Array<{ sessaoId: string; rotulo: string }>;
    sessoesIgnoradas: Array<{ sessaoId: string; rotulo: string; motivo: string }>;
  },
): Promise<void> {
  if (await hasSubmittedTutorEvaluation(manager, session.id)) {
    result.sessoesIgnoradas.push({
      sessaoId: session.id,
      rotulo: session.title,
      motivo: 'AVALIACAO_ENVIADA',
    });
    return;
  }
  await replaceSessionTable(manager, session, table);
  result.sessoesAtualizadas.push({ sessaoId: session.id, rotulo: session.title });
}

async function hasSubmittedTutorEvaluation(
  manager: EntityManager,
  sessionId: string,
): Promise<boolean> {
  const [row] = await manager.query<Array<{ exists: boolean }>>(
    `SELECT EXISTS (
       SELECT 1 FROM evaluations
        WHERE session_id = $1 AND type = 'TUTOR_SESSION' AND status = 'SUBMITTED'
     ) AS exists;`,
    [sessionId],
  );
  return row?.exists ?? false;
}

async function replaceSessionTable(
  manager: EntityManager,
  session: SessionConfigRow,
  table: SessionTableRow,
): Promise<void> {
  await manager.query('UPDATE sessions SET performance_table_id = $2 WHERE id = $1;', [
    session.id,
    table.id,
  ]);
  if (!(await hasEvaluationSnapshot(manager, session.id))) return;
  await replaceSessionSnapshot(manager, session.id, table);
  await removeObsoleteDraftItems(manager, session.id);
  await manager.query(
    `UPDATE evaluations SET performance_table_id = $2
      WHERE session_id = $1 AND status = 'DRAFT';`,
    [session.id, table.id],
  );
}

async function hasEvaluationSnapshot(manager: EntityManager, sessionId: string): Promise<boolean> {
  const [row] = await manager.query<Array<{ exists: boolean }>>(
    `SELECT EXISTS (
       SELECT 1 FROM session_evaluation_configs WHERE session_id = $1
     ) AS exists;`,
    [sessionId],
  );
  return row?.exists ?? false;
}
