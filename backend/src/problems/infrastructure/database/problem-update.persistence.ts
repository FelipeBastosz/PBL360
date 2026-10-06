import type { EntityManager } from 'typeorm';
import { ConflictError, NotFoundError } from '@/shared/errors/application.error';
import type { UpdateProblemDetails } from '../../domain/repositories/problem.repository';

export async function hasProblemEvaluations(
  manager: EntityManager,
  problemId: string,
): Promise<boolean> {
  const [row] = await manager.query<{ exists: boolean }[]>(
    'SELECT EXISTS (SELECT 1 FROM evaluations WHERE problem_id = $1) AS exists;',
    [problemId],
  );
  return row?.exists ?? false;
}

export async function updateProblemDetails(
  manager: EntityManager,
  input: UpdateProblemDetails,
): Promise<void> {
  const [problem] = await manager.query<{ tableId: string | null }[]>(
    'SELECT performance_table_id AS "tableId" FROM problems WHERE id = $1 AND room_id = $2 FOR UPDATE;',
    [input.id, input.roomId],
  );
  if (!problem) throw new NotFoundError('Problema não encontrado.');
  const tableId = input.tableId === undefined ? problem.tableId : input.tableId;
  if (tableId !== problem.tableId) await validateTableChange(manager, input, tableId);
  await manager.query(
    'UPDATE problems SET title = $2, performance_table_id = $3, updated_by = $4, updated_at = now() WHERE id = $1;',
    [input.id, input.title, tableId, input.authorId],
  );
}

async function validateTableChange(
  manager: EntityManager,
  input: UpdateProblemDetails,
  tableId: string | null,
): Promise<void> {
  if (await hasProblemEvaluations(manager, input.id)) {
    throw new ConflictError(
      'A tabela não pode ser alterada após a primeira avaliação do problema.',
    );
  }
  if (tableId === null) return;
  const tables = await manager.query<{ id: string }[]>(
    'SELECT id FROM performance_tables WHERE id = $1 AND tutor_id = $2 AND deleted_at IS NULL FOR SHARE;',
    [tableId, input.authorId],
  );
  if (tables.length === 0) throw new NotFoundError('Tabela de desempenho não encontrada.');
}
