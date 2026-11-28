import { useEffect, useState } from 'react';
import { evaluationHistoryService } from '@/services/evaluationHistory.service';
import type { StudentEvaluationHistoryDetail } from '@/types/evaluationHistory';

type DetailState = {
  key: string | null;
  detail: StudentEvaluationHistoryDetail | null;
  failed: boolean;
};

export function useStudentHistoryDetail(
  sessionId: string | undefined,
  studentId: string | null,
  revision = '',
) {
  const key = sessionId && studentId ? `${sessionId}:${studentId}:${revision}` : null;
  const [state, setState] = useState<DetailState>({ key: null, detail: null, failed: false });

  useEffect(() => {
    if (!sessionId || !studentId || !key) return;
    let active = true;
    evaluationHistoryService
      .detail(sessionId, studentId)
      .then((detail) => active && setState({ key, detail, failed: false }))
      .catch(() => active && setState({ key, detail: null, failed: true }));
    return () => {
      active = false;
    };
  }, [sessionId, studentId, key]);

  const isCurrent = key !== null && state.key === key;
  return {
    detail: isCurrent ? state.detail : null,
    isLoading: key !== null && !isCurrent,
    failed: isCurrent && state.failed,
  };
}
