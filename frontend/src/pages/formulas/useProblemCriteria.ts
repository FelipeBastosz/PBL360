import { useEffect, useState } from 'react';
import { performanceTableService } from '@/services/performance-table.service';
import { problemService } from '@/services/problem.service';
import type { TableCriterion } from '@/utils/formula';

// Criteria of the performance table linked to the problem: the ones a session formula can use.
async function loadCriteria(roomId: string, problemId: string): Promise<TableCriterion[]> {
  const problem = await problemService.getById(roomId, problemId);
  if (!problem.tabelaId) return [];
  const table = await performanceTableService.getById(problem.tabelaId);
  return table.criterios.map(({ id, nome }) => ({ id, nome }));
}

export function useProblemCriteria(roomId: string, problemId: string) {
  const [criteria, setCriteria] = useState<TableCriterion[]>([]);

  useEffect(() => {
    let active = true;
    loadCriteria(roomId, problemId)
      .then((result) => active && setCriteria(result))
      .catch(() => active && setCriteria([]));
    return () => {
      active = false;
    };
  }, [roomId, problemId]);

  return criteria;
}
