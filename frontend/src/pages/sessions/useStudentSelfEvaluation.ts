import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { useToast } from '@/hooks/useToast';
import { evaluationService } from '@/services/evaluation.service';
import { sessionService } from '@/services/session.service';
import type { SelfAssessmentResponse } from '@/types/evaluation';
import type { MemberSession } from '@/types/session';

function buildInitialScores(data: SelfAssessmentResponse): Record<string, number> {
  const scores: Record<string, number> = {};
  data.criterios.forEach((c) => {
    const found = data.itens.find((i) => i.criterioId === c.id);
    scores[c.id] = found?.nota ?? 0;
  });
  return scores;
}

const toScoreItems = (scores: Record<string, number>) =>
  Object.entries(scores).map(([criterioId, nota]) => ({ criterioId, nota }));

function useSelfEvaluationData(sessionId: string) {
  const [data, setData] = useState<SelfAssessmentResponse | null>(null);
  const [session, setSession] = useState<MemberSession | null>(null);
  const [scores, setScores] = useState<Record<string, number>>({});

  const { run: loadSession } = useAsyncAction(
    useCallback(() => sessionService.getForMember(sessionId), [sessionId]),
  );
  const {
    run: loadEval,
    isLoading,
    error,
  } = useAsyncAction(
    useCallback(() => evaluationService.getSelfAssessment(sessionId), [sessionId]),
  );

  useEffect(() => {
    loadSession().then((r) => r.ok && setSession(r.data));
    loadEval().then((r) => {
      if (r.ok) {
        setData(r.data);
        setScores(buildInitialScores(r.data));
      }
    });
  }, [loadSession, loadEval]);

  return { data, session, scores, setScores, isLoading, error };
}

function scheduleDraftSave(
  timerRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>,
  sessionId: string,
  updated: Record<string, number>,
) {
  if (timerRef.current) clearTimeout(timerRef.current);
  timerRef.current = setTimeout(() => {
    evaluationService
      .saveSelfAssessment(sessionId, { itens: toScoreItems(updated), enviar: false })
      .catch(() => {});
  }, 500);
}

function useSubmitSelfAssessment(sessionId: string, scores: Record<string, number>) {
  const navigate = useNavigate();
  const { notify } = useToast();
  const {
    run: submitEval,
    isLoading: isSaving,
    error: saveError,
  } = useAsyncAction(
    useCallback(
      () =>
        evaluationService.saveSelfAssessment(sessionId, {
          itens: toScoreItems(scores),
          enviar: true,
        }),
      [sessionId, scores],
    ),
  );

  const handleSave = async (onBeforeSubmit?: () => void) => {
    onBeforeSubmit?.();
    const res = await submitEval();
    if (res.ok) {
      notify({ tone: 'success', message: 'Autoavaliação enviada com sucesso!' });
      navigate(-1);
    }
  };

  return { isSaving, saveError, handleSave };
}

export function useStudentSelfEvaluation(sessionId: string) {
  const { data, session, scores, setScores, isLoading, error } = useSelfEvaluationData(sessionId);
  const {
    isSaving,
    saveError,
    handleSave: submitAssessment,
  } = useSubmitSelfAssessment(sessionId, scores);
  const draftTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const timer = draftTimerRef.current;
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, []);

  const setScore = (id: string, s: number) => {
    setScores((prev) => {
      const updated = { ...prev, [id]: s };
      if (data?.status !== 'ENVIADA' && data?.status !== 'NAO_PARTICIPOU') {
        scheduleDraftSave(draftTimerRef, sessionId, updated);
      }
      return updated;
    });
  };

  const didNotParticipate =
    data?.participou === false ||
    data?.status === 'NAO_PARTICIPOU' ||
    Boolean(error && /não participou/i.test(error.message));

  return {
    data,
    session,
    scores,
    isLoading,
    isSaving,
    error,
    saveError,
    didNotParticipate,
    handleSave: () =>
      submitAssessment(() => {
        if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
      }),
    setScore,
  };
}
