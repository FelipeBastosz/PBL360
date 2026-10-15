import { useEffect, useState } from 'react';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { feedbackService } from '@/services/feedback.service';
import type { ReceivedFeedbackResponse } from '@/types/feedback';

export function useSessionFeedback(sessionId?: string) {
  const [feedback, setFeedback] = useState<ReceivedFeedbackResponse | null>(null);
  const [hasFetched, setHasFetched] = useState(false);
  const { run, isLoading, error } = useAsyncAction(feedbackService.getMySessionFeedback);

  useEffect(() => {
    if (!sessionId) return;
    run(sessionId).then((res) => {
      if (res.ok) setFeedback(res.data);
      setHasFetched(true);
    });
  }, [sessionId, run]);

  const hasLoaded = !sessionId || hasFetched;

  return {
    feedback,
    isLoading: isLoading || !hasLoaded,
    error: error?.message ?? null,
  };
}
