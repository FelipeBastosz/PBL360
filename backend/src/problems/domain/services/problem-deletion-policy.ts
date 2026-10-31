import { ConflictError } from '@/shared/errors/application.error';
import type { ProblemDeletionImpact } from '../repositories/problem.repository';

export function assertProblemCanBeDeleted(impact: ProblemDeletionImpact): void {
  if (Object.values(impact).every((count) => count === 0)) return;
  throw new ConflictError('O problema não pode ser excluído pois possui registros vinculados.', {
    detalhes: {
      sessoes: impact.sessions,
      notas: impact.grades,
      feedbacks: impact.feedbacks,
      avaliacoes: impact.evaluations,
    },
  });
}
