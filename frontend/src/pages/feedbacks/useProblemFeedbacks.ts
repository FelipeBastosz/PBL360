import { useEffect, useState } from 'react';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { feedbackService } from '@/services/feedback.service';
import type { ReceivedProblemFeedbacksResponse } from '@/types/feedback';

export function useProblemFeedbacks(roomId?: string, problemId?: string) {
  const [data, setData] = useState<ReceivedProblemFeedbacksResponse | null>(null);
  const [hasFetched, setHasFetched] = useState(false);
  const { run, isLoading, error } = useAsyncAction(feedbackService.getMyProblemFeedbacks);

  useEffect(() => {
    if (!roomId || !problemId) return;
    run(roomId, problemId).then((res) => {
      if (res.ok) setData(res.data);
      setHasFetched(true);
    });
  }, [roomId, problemId, run]);

  const hasLoaded = !roomId || !problemId || hasFetched;

  return {
    data,
    isLoading: isLoading || !hasLoaded,
    error: error?.message ?? null,
  };
}
