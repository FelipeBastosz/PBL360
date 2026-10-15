import { useCallback, useEffect, useState } from 'react';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { evaluationHistoryService } from '@/services/evaluationHistory.service';
import type { SelfAssessmentAdjustmentResponse } from '@/types/evaluation';
import type { StudentEvaluationHistoryItem } from '@/types/evaluationHistory';
import { applyAdjustment } from '@/utils/evaluationHistory';

export function useEvaluationHistory(sessionId: string | undefined) {
  const [students, setStudents] = useState<StudentEvaluationHistoryItem[]>([]);
  const { run, isLoading, error } = useAsyncAction(evaluationHistoryService.list);

  useEffect(() => {
    if (!sessionId) return;
    run(sessionId).then((result) => {
      if (result.ok) setStudents(result.data.alunos);
    });
  }, [sessionId, run]);

  const handleAdjusted = useCallback((response: SelfAssessmentAdjustmentResponse) => {
    setStudents((current) => applyAdjustment(current, response));
  }, []);

  return { students, isLoading, error, handleAdjusted };
}
