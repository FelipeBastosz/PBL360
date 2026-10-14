import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/useToast';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { evaluationService } from '@/services/evaluation.service';
import { observationService } from '@/services/observation.service';
import type {
  EvaluationCriterion,
  EvaluationStatus,
  SaveTutorEvaluationPayload,
} from '@/types/evaluation';
import type { BehaviorTag, ObservationItem } from '@/types/observation';

function draftStorageKey(sessionId: string, studentId: string) {
  return `eval_draft_${sessionId}_${studentId}`;
}

function loadStoredDraft(sessionId: string, studentId: string) {
  try {
    const raw = sessionStorage.getItem(draftStorageKey(sessionId, studentId));
    return raw ? (JSON.parse(raw) as { scores: Record<string, number>; feedback: string }) : null;
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
  const itens = criteria.map((c) => ({ criterioId: c.id, nota: scores[c.id] ?? 0 }));
  const result = await runSave(sessionId, studentId, { itens, enviar, justificativa });
  if (result.ok) {
    await evaluationService.saveFeedback(sessionId, studentId, feedback.trim());
    clearStoredDraft(sessionId, studentId);
    notify({
      tone: enviar ? 'success' : 'info',
      message: enviar ? 'Avaliação enviada com sucesso.' : 'Rascunho salvo com sucesso.',
    });
    navigate(-1);
  }
}

function useFetchStudentEvaluation(sessionId: string, studentId: string) {
  const [criteria, setCriteria] = useState<EvaluationCriterion[]>([]);
  const [scores, setScores] = useState<Record<string, number>>({});
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
          setCriteria(res.data.evalData.criterios);
          setStatus(res.data.evalData.status);
          const backendScores = toScoresMap(res.data.evalData.itens);
          const backendFeedback = res.data.fbData?.texto || '';
          const cached = loadStoredDraft(sessionId, studentId);
          setScores(cached?.scores ?? backendScores);
          setFeedback(cached?.feedback ?? backendFeedback);
        }
      });
    }
  }, [sessionId, studentId, run]);

  return { criteria, scores, setScores, feedback, setFeedback, status, isLoading, error };
}

function useStudentObservationTagsState(sessionId: string, studentId: string) {
  const [tags, setTags] = useState<BehaviorTag[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [observations, setObservations] = useState<ObservationItem[]>([]);

  const fetchObs = useCallback(async () => {
    const [tagList, obsData] = await Promise.all([
      observationService.listTags().catch(() => []),
      observationService
        .listStudentObservations(sessionId, studentId)
        .catch(() => ({ observacoes: [], contagem: {} })),
    ]);
    return { tagList, obsData };
  }, [sessionId, studentId]);

  useEffect(() => {
    if (sessionId && studentId) {
      fetchObs().then((res) => {
        setTags(res.tagList);
        setCounts(res.obsData.contagem);
        setObservations(res.obsData.observacoes);
      });
    }
  }, [sessionId, studentId, fetchObs]);

  async function handleTagClick(tagId: string) {
    setCounts((prev) => ({ ...prev, [tagId]: (prev[tagId] ?? 0) + 1 }));
    const created = await observationService.registerObservation(sessionId, studentId, {
      marcacaoIds: [tagId],
    });
    setObservations((prev) => [...prev, created]);
  }

  async function handleTagDecrement(tagId: string) {
    setCounts((prev) => ({ ...prev, [tagId]: Math.max(0, (prev[tagId] ?? 1) - 1) }));
    const target = observations
      .slice()
      .reverse()
      .find((o) => o.marcacoes.some((m) => m.id === tagId));
    if (target) {
      setObservations((prev) => prev.filter((o) => o.id !== target.id));
      await observationService.undoObservation(target.id).catch(() => null);
    }
  }

  return { tags, counts, handleTagClick, handleTagDecrement };
}

export function useStudentEvaluation(sessionId: string, studentId: string) {
  const navigate = useNavigate();
  const { notify } = useToast();
  const evalData = useFetchStudentEvaluation(sessionId, studentId);
  const tagData = useStudentObservationTagsState(sessionId, studentId);
  const { run: runSave, isLoading: isSaving } = useAsyncAction(evaluationService.saveEvaluation);

  const handleScoreChange = (id: string, val: number) =>
    evalData.setScores((prev) => ({ ...prev, [id]: val }));

  const submitEvaluation = (enviar: boolean, justificativa?: string) =>
    sendEvaluation(
      sessionId,
      studentId,
      evalData.criteria,
      evalData.scores,
      evalData.feedback,
      enviar,
      justificativa,
      runSave,
      notify,
      navigate,
    );

  async function saveDraftAndNavigate(targetUrl: string, stateData: unknown) {
    try {
      sessionStorage.setItem(
        draftStorageKey(sessionId, studentId),
        JSON.stringify({ scores: evalData.scores, feedback: evalData.feedback }),
      );
    } catch {
      // ignore
    }

    if (evalData.status !== 'ENVIADA') {
      const itens = evalData.criteria.map((c) => ({
        criterioId: c.id,
        nota: evalData.scores[c.id] ?? 0,
      }));
      await runSave(sessionId, studentId, { itens, enviar: false }).catch(() => null);
      await evaluationService
        .saveFeedback(sessionId, studentId, evalData.feedback.trim())
        .catch(() => null);
    }

    navigate(targetUrl, { state: stateData });
  }

  return {
    ...evalData,
    ...tagData,
    isSaving,
    handleScoreChange,
    submitEvaluation,
    saveDraftAndNavigate,
  };
}
