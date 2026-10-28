import { ConflictError } from '@/shared/errors/application.error';
import type { SessionDeletionImpact } from '../repositories/session.repository';

export function assertSessionCanBeDeleted(impact: SessionDeletionImpact): void {
  if (Object.values(impact).every((count) => count === 0)) return;
  throw new ConflictError('A sessão não pode ser excluída pois possui registros vinculados.', {
    detalhes: { ...impact },
  });
}
