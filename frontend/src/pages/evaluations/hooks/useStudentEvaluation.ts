import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/useToast';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { evaluationService } from '@/services/evaluation.service';
import { isFeedbackOverLimit } from '@/utils/feedbackTemplates';
import { useStudentObservationTags } from './useStudentObservationTags';
import type {
  EvaluationCriterion,
  EvaluationFormula,
  EvaluationStatus,
  SaveTutorEvaluationPayload,
} from '@/types/evaluation';
import type { SessionRole } from '@/types/session';
import { normalizeSessionRole } from '@/utils/sessionRoles';

function draftStorageKey(sessionId: string, studentId: string) {
  return `eval_draft_${sessionId}_${studentId}`;
}

function loadStoredDraft(sessionId: string, studentId: string) {
  try {
    const raw = sessionStorage.getItem(draftStorageKey(sessionId, studentId));
    return raw
      ? (JSON.parse(raw) as {
          scores: Record<string, number>;
          feedback: string;
          notaCargo?: number;
        })
      : null;
  } catch {
    return null;
  }
}

function clearStoredDraft(sessionId: string, studentId: string) {
  try {
    sessionStorage.removeItem(draftStorageKey(sessionId, studentId));
  } catch {
    // ignore
  }
}

function toScoresMap(itens: Array<{ criterioId: string; nota: number }>) {
  const map: Record<string, number> = {};
  itens.forEach((i) => {
    map[i.criterioId] = i.nota;
  });
  return map;
}

async function sendEvaluation(
  sessionId: string,
  studentId: string,
  criteria: EvaluationCriterion[],
  scores: Record<string, number>,
  notaCargo: number | null,
  feedback: string,
  enviar: boolean,
  justificativa: string | undefined,
  runSave: (
    sId: string,
    stId: string,
    payload: SaveTutorEvaluationPayload,
  ) => Promise<{ ok: boolean }>,
  notify: (t: { tone: 'success' | 'info'; message: string }) => void,
  navigate: (to: number) => void,
) {
  if (isFeedbackOverLimit(feedback)) return;
  const itens = criteria.map((c) => ({ criterioId: c.id, nota: scores[c.id] ?? 0 }));
  const result = await runSave(sessionId, studentId, { itens, enviar, justificativa, notaCargo });
  if (result.ok) {
    const trimmedFeedback = feedback.trim();
    if (trimmedFeedback) {
      await evaluationService.saveFeedback(sessionId, studentId, trimmedFeedback);
    }
    clearStoredDraft(sessionId, studentId);
    notify({
      tone: enviar ? 'success' : 'info',
      message: enviar ? 'Avaliação enviada com sucesso.' : 'Rascunho salvo com sucesso.',
    });
    navigate(-1);
  }
}

type FetchedData = Awaited<ReturnType<typeof evaluationService.getEvaluation>>;
type FetchedFeedback = Awaited<ReturnType<typeof evaluationService.getFeedback>> | null;

function applyFetchedData(
  evalData: FetchedData,
  fbData: FetchedFeedback,
  cached: ReturnType<typeof loadStoredDraft>,
) {
  const hasPapel = Boolean(evalData.papel);
  const backendCargo = evalData.notaCargo ?? evalData.adicionalAplicado ?? (hasPapel ? 0 : null);
  const backendScores = toScoresMap(evalData.itens);
  const backendFeedback = fbData?.texto || '';
  return {
    criteria: evalData.criterios,
    status: evalData.status,
    papel: normalizeSessionRole(evalData.papel),
    formula: evalData.formula,
    scores: cached?.scores ?? backendScores,
    feedback: cached?.feedback ?? backendFeedback,
    notaCargo: cached?.notaCargo !== undefined ? cached.notaCargo : backendCargo,
  };
}

function useFetchStudentEvaluation(sessionId: string, studentId: string) {
  const [criteria, setCriteria] = useState<EvaluationCriterion[]>([]);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [notaCargo, setNotaCargo] = useState<number | null>(null);
  const [papel, setPapel] = useState<SessionRole | null>(null);
  const [formula, setFormula] = useState<EvaluationFormula | undefined>(undefined);
  const [feedback, setFeedback] = useState('');
  const [status, setStatus] = useState<EvaluationStatus>('PENDENTE');

  const fetchDetails = useCallback(async () => {
    const [evalData, fbData] = await Promise.all([
      evaluationService.getEvaluation(sessionId, studentId),
      evaluationService.getFeedback(sessionId, studentId).catch(() => null),
    ]);
    return { evalData, fbData };
  }, [sessionId, studentId]);

  const { run, isLoading, error } = useAsyncAction(fetchDetails);

  useEffect(() => {
    if (sessionId && studentId) {
      run().then((res) => {
        if (res.ok) {
          const cached = loadStoredDraft(sessionId, studentId);
          const state = applyFetchedData(res.data.evalData, res.data.fbData, cached);
          setCriteria(state.criteria);
          setStatus(state.status);
          setPapel(state.papel);
          setFormula(state.formula);
          setScores(state.scores);
          setFeedback(state.feedback);
          setNotaCargo(state.notaCargo);
        }
      });
    }
  }, [sessionId, studentId, run]);

  return {
    criteria,
    scores,
    setScores,
    notaCargo,
    setNotaCargo,
    papel,
    formula,
    feedback,
    setFeedback,
    status,
    isLoading,
    error,
  };
}

async function saveDraftAndNavigateHelper(
  sessionId: string,
  studentId: string,
  evalData: ReturnType<typeof useFetchStudentEvaluation>,
  runSave: (
    sId: string,
    stId: string,
    payload: SaveTutorEvaluationPayload,
  ) => Promise<{ ok: boolean }>,
  navigate: ReturnType<typeof useNavigate>,
  targetUrl: string,
  stateData: unknown,
) {
  try {
    sessionStorage.setItem(
      draftStorageKey(sessionId, studentId),
      JSON.stringify({
        scores: evalData.scores,
        feedback: evalData.feedback,
        notaCargo: evalData.notaCargo,
      }),
    );
  } catch {
    // ignore
  }

  if (evalData.status !== 'ENVIADA' && !isFeedbackOverLimit(evalData.feedback)) {
    const itens = evalData.criteria.map((c) => ({
      criterioId: c.id,
      nota: evalData.scores[c.id] ?? 0,
    }));
    await runSave(sessionId, studentId, {
      itens,
      enviar: false,
      notaCargo: evalData.notaCargo,
    }).catch(() => null);
    const trimmedFeedback = evalData.feedback.trim();
    if (trimmedFeedback) {
      await evaluationService.saveFeedback(sessionId, studentId, trimmedFeedback).catch(() => null);
    }
  }

  navigate(targetUrl, { state: stateData });
}

export function useStudentEvaluation(sessionId: string, studentId: string) {
  const navigate = useNavigate();
  const { notify } = useToast();
  const evalData = useFetchStudentEvaluation(sessionId, studentId);
  const tagData = useStudentObservationTags(sessionId, studentId);
  const { run: runSave, isLoading: isSaving } = useAsyncAction(evaluationService.saveEvaluation);

  const handleScoreChange = (id: string, val: number) =>
    evalData.setScores((prev) => ({ ...prev, [id]: val }));

  const submitEvaluation = (enviar: boolean, justificativa?: string) =>
    sendEvaluation(
      sessionId,
      studentId,
      evalData.criteria,
      evalData.scores,
      evalData.notaCargo,
      evalData.feedback,
      enviar,
      justificativa,
      runSave,
      notify,
      navigate,
    );

  const saveDraftAndNavigate = (targetUrl: string, stateData: unknown) =>
    saveDraftAndNavigateHelper(
      sessionId,
      studentId,
      evalData,
      runSave,
      navigate,
      targetUrl,
      stateData,
    );

  return {
    ...evalData,
    ...tagData,
    isSaving,
    handleScoreChange,
    submitEvaluation,
    saveDraftAndNavigate,
  };
}
