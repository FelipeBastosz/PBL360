import type { EntityManager } from 'typeorm';
import { NotFoundError } from '@/shared/errors/application.error';
import type { UpdateProblemDetails } from '../../domain/repositories/problem.repository';

export async function updateProblemDetails(
  manager: EntityManager,
  input: UpdateProblemDetails,
): Promise<void> {
  const [problem] = await manager.query<{ id: string }[]>(
    'SELECT id FROM problems WHERE id = $1 AND room_id = $2 FOR UPDATE;',
    [input.id, input.roomId],
  );
  if (!problem) throw new NotFoundError('Problema não encontrado.');
  await manager.query(
    'UPDATE problems SET title = $2, updated_by = $3, updated_at = now() WHERE id = $1;',
    [input.id, input.title, input.authorId],
  );
}
