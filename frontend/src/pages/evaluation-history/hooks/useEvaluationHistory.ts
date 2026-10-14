import { useEffect, useState } from 'react';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { evaluationHistoryService } from '@/services/evaluationHistory.service';
import type { StudentEvaluationHistoryItem } from '@/types/evaluationHistory';

export function useEvaluationHistory(sessionId: string | undefined) {
  const [students, setStudents] = useState<StudentEvaluationHistoryItem[]>([]);
  const { run, isLoading, error } = useAsyncAction(evaluationHistoryService.list);

  useEffect(() => {
    if (!sessionId) return;
    run(sessionId).then((result) => {
      if (result.ok) setStudents(result.data.alunos);
    });
  }, [sessionId, run]);

  return { students, isLoading, error };
}
