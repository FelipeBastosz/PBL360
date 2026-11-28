import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { useToast } from '@/hooks/useToast';
import { ApiError } from '@/services/apiError';
import { evaluationService } from '@/services/evaluation.service';
import { sessionService } from '@/services/session.service';
import type { SelfAssessmentResponse } from '@/types/evaluation';
import type { MemberSession } from '@/types/session';
import { normalizeSessionRole } from '@/utils/sessionRoles';

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
  const [notaCargo, setNotaCargo] = useState<number | null>(null);

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

  const reload = useCallback(
    () =>
      loadEval().then((r) => {
        if (r.ok) {
          setData(r.data);
          setScores(buildInitialScores(r.data));
          setNotaCargo(r.data.notaCargo ?? (r.data.papel ? 0 : null));
        }
      }),
    [loadEval],
  );

  useEffect(() => {
    loadSession().then((r) => r.ok && setSession(r.data));
    reload();
  }, [loadSession, reload]);

  return { data, session, scores, setScores, notaCargo, setNotaCargo, isLoading, error, reload };
}

const LOCKED_STATUS = 423;

type DraftTarget = {
  timerRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>;
  sessionId: string;
  onLocked: () => void;
};

function scheduleDraftSave(
  target: DraftTarget,
  updated: Record<string, number>,
  cargo: number | null,
) {
  const { timerRef, sessionId, onLocked } = target;
  if (timerRef.current) clearTimeout(timerRef.current);
  timerRef.current = setTimeout(() => {
    evaluationService
      .saveSelfAssessment(sessionId, {
        itens: toScoreItems(updated),
        notaCargo: cargo,
        enviar: false,
      })
      .catch((err: unknown) => {
        if (err instanceof ApiError && err.status === LOCKED_STATUS) onLocked();
      });
  }, 500);
}

function isPastDeadline(deadline: string | null | undefined, now = Date.now()): boolean {
  return Boolean(deadline) && new Date(deadline!).getTime() <= now;
}

function useSubmitSelfAssessment(
  sessionId: string,
  scores: Record<string, number>,
  notaCargo: number | null,
) {
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
          notaCargo,
          enviar: true,
        }),
      [sessionId, scores, notaCargo],
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

type ScoreHandlersInput = {
  draft: DraftTarget;
  data: SelfAssessmentResponse | null;
  scores: Record<string, number>;
  setScores: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  notaCargo: number | null;
  setNotaCargo: React.Dispatch<React.SetStateAction<number | null>>;
};

const LOCKED_STATUSES = ['ENVIADA', 'NAO_PARTICIPOU', 'ENCERRADA'];

function useSelfScoreHandlers(input: ScoreHandlersInput) {
  const { draft, data, scores, setScores, notaCargo, setNotaCargo } = input;
  const isEditable = !LOCKED_STATUSES.includes(data?.status ?? '');

  const saveDraft = (updated: Record<string, number>, cargo: number | null) => {
    if (!isEditable) return;
    if (isPastDeadline(data?.prazo)) draft.onLocked();
    else scheduleDraftSave(draft, updated, cargo);
  };

  const setScore = (id: string, s: number) => {
    const updated = { ...scores, [id]: s };
    setScores(updated);
    saveDraft(updated, notaCargo);
  };

  const handleCargoChange = (s: number) => {
    setNotaCargo(s);
    saveDraft(scores, s);
  };

  return { setScore, handleCargoChange };
}

export function useStudentSelfEvaluation(sessionId: string) {
  const { data, session, scores, setScores, notaCargo, setNotaCargo, isLoading, error, reload } =
    useSelfEvaluationData(sessionId);
  const {
    isSaving,
    saveError,
    handleSave: submitAssessment,
  } = useSubmitSelfAssessment(sessionId, scores, notaCargo);
  const draftTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelPendingDraft = useCallback(() => {
    if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
    draftTimerRef.current = null;
  }, []);

  useEffect(() => cancelPendingDraft, [cancelPendingDraft]);

  const onLocked = useCallback(() => {
    cancelPendingDraft();
    void reload();
  }, [cancelPendingDraft, reload]);

  const { setScore, handleCargoChange } = useSelfScoreHandlers({
    draft: { timerRef: draftTimerRef, sessionId, onLocked },
    data,
    scores,
    setScores,
    notaCargo,
    setNotaCargo,
  });

  const didNotParticipate = data?.participou === false;

  return {
    data,
    session,
    scores,
    notaCargo,
    papel: data?.papel ? normalizeSessionRole(data.papel) : null,
    formula: data?.formula,
    isLoading,
    isSaving,
    error,
    saveError,
    didNotParticipate,
    handleSave: () => submitAssessment(cancelPendingDraft),
    setScore,
    setNotaCargo: handleCargoChange,
  };
}
