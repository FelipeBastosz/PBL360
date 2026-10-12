import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { useToast } from '@/hooks/useToast';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { evaluationService } from '@/services/evaluation.service';
import type {
  EvaluationCriterion,
  EvaluationStatus,
  SaveTutorEvaluationPayload,
} from '@/types/evaluation';
import { EvaluationHeader } from './components/EvaluationHeader';
import { CriteriaScoresCard } from './components/CriteriaScoresCard';
import { QuickObservationsCard } from './components/QuickObservationsCard';
import { EvaluationFeedbackCard } from './components/EvaluationFeedbackCard';
import { JustificationModal } from './components/JustificationModal';

function EvaluationActionButtons({
  onSend,
  onDraft,
  isSaving,
}: {
  onSend: () => void;
  onDraft: () => void;
  isSaving: boolean;
}) {
  return (
    <div className="mt-2 flex flex-col gap-2.5">
      <button
        type="button"
        onClick={onSend}
        disabled={isSaving}
        className="w-full rounded-2xl bg-brand-900 py-3.5 text-base font-bold text-white shadow-lg transition hover:bg-brand-800 active:scale-[0.98] disabled:opacity-50"
      >
        Enviar avaliação e feedback
      </button>
      <button
        type="button"
        onClick={onDraft}
        disabled={isSaving}
        className="w-full rounded-2xl border border-brand-900 bg-white py-3 text-sm font-bold text-brand-900 transition hover:bg-brand-50 active:scale-[0.98] disabled:opacity-50"
      >
        Salvar rascunho
      </button>
    </div>
  );
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
    if (feedback.trim()) {
      await evaluationService.saveFeedback(sessionId, studentId, feedback.trim());
    }
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
          setScores(toScoresMap(res.data.evalData.itens));
          if (res.data.fbData) setFeedback(res.data.fbData.texto);
        }
      });
    }
  }, [sessionId, studentId, run]);

  return { criteria, scores, setScores, feedback, setFeedback, status, isLoading, error };
}

function useStudentEvaluation(sessionId: string, studentId: string) {
  const navigate = useNavigate();
  const { notify } = useToast();
  const data = useFetchStudentEvaluation(sessionId, studentId);
  const { run: runSave, isLoading: isSaving } = useAsyncAction(evaluationService.saveEvaluation);

  const submitEvaluation = (enviar: boolean, justificativa?: string) =>
    sendEvaluation(
      sessionId,
      studentId,
      data.criteria,
      data.scores,
      data.feedback,
      enviar,
      justificativa,
      runSave,
      notify,
      navigate,
    );

  return { ...data, isSaving, submitEvaluation };
}

type MainContentProps = {
  studentName: string;
  state: ReturnType<typeof useStudentEvaluation>;
  complement: string;
  onComplementChange: (v: string) => void;
  onSend: () => void;
};

function EvaluationMainContent({
  studentName,
  state,
  complement,
  onComplementChange,
  onSend,
}: MainContentProps) {
  if (state.isLoading) {
    return (
      <div className="mt-12 flex justify-center">
        <Spinner className="size-8 text-brand-900" />
      </div>
    );
  }

  return (
    <>
      <CriteriaScoresCard
        studentName={studentName}
        criteria={state.criteria}
        scores={state.scores}
        onScoreChange={(id, val) => state.setScores((prev) => ({ ...prev, [id]: val }))}
      />
      <QuickObservationsCard complement={complement} onComplementChange={onComplementChange} />
      <EvaluationFeedbackCard feedback={state.feedback} onChange={state.setFeedback} />
      <EvaluationActionButtons
        onSend={onSend}
        onDraft={() => state.submitEvaluation(false)}
        isSaving={state.isSaving}
      />
    </>
  );
}

export function StudentEvaluationPage() {
  const { sessionId = '', studentId = '' } = useParams<{ sessionId: string; studentId: string }>();
  const location = useLocation();
  const studentName = (location.state as { studentName?: string })?.studentName || 'Aluno';
  const [complement, setComplement] = useState('');
  const [isJustifyOpen, setIsJustifyOpen] = useState(false);

  const state = useStudentEvaluation(sessionId, studentId);

  const handleSend = () =>
    state.status === 'ENVIADA' ? setIsJustifyOpen(true) : state.submitEvaluation(true);

  const handleJustifyConfirm = (just: string) => {
    setIsJustifyOpen(false);
    state.submitEvaluation(true, just);
  };

  return (
    <div className="min-h-dvh bg-surface pb-12">
      <EvaluationHeader />
      <main className="mx-auto mt-4 flex w-full max-w-md flex-col gap-4 px-4">
        {state.error && <Alert tone="error">{state.error.message}</Alert>}
        <EvaluationMainContent
          studentName={studentName}
          state={state}
          complement={complement}
          onComplementChange={setComplement}
          onSend={handleSend}
        />
      </main>
      <JustificationModal
        isOpen={isJustifyOpen}
        isLoading={state.isSaving}
        onConfirm={handleJustifyConfirm}
        onCancel={() => setIsJustifyOpen(false)}
      />
    </div>
  );
}

export default StudentEvaluationPage;
