import { useState, useEffect, useCallback } from 'react';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { feedbackService } from '@/services/feedback.service';
import type { FeedbackTemplateResponse } from '@/types/feedback';

export function useFeedbackTemplates() {
  const [templates, setTemplates] = useState<FeedbackTemplateResponse[]>([]);
  const { run, isLoading, error } = useAsyncAction(feedbackService.listTemplates);

  const reload = useCallback(async () => {
    const res = await run();
    if (res.ok) setTemplates(res.data);
    return res;
  }, [run]);

  useEffect(() => {
    run().then((res) => {
      if (res.ok) setTemplates(res.data);
    });
  }, [run]);

  return {
    templates,
    isLoading,
    error: error ? 'Não foi possível carregar os modelos de feedback.' : null,
    reload,
  };
}
