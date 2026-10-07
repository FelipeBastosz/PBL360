import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { useToast } from '@/hooks/useToast';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { evaluationService } from '@/services/evaluation.service';
import type { EvaluationCriterion, EvaluationStatus } from '@/types/evaluation';
import { EvaluationHeader } from './components/EvaluationHeader';
import { CriteriaScoresCard } from './components/CriteriaScoresCard';
import { QuickObservationsCard } from './components/QuickObservationsCard';
import { EvaluationFeedbackCard } from './components/EvaluationFeedbackCard';
import { JustificationModal } from './components/JustificationModal';

export function StudentEvaluationPage() {
  const { sessionId = '', studentId = '' } = useParams<{ sessionId: string; studentId: string }>();
  const navigate = useNavigate();
  const { notify } = useToast();

  const [criteria, setCriteria] = useState<EvaluationCriterion[]>([]);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [feedback, setFeedback] = useState('');
  const [complement, setComplement] = useState('');
  const [status, setStatus] = useState<EvaluationStatus>('PENDENTE');
  const [isJustifyOpen, setIsJustifyOpen] = useState(false);

  const fetchDetails = useCallback(async () => {
    const [evalData, fbData] = await Promise.all([
      evaluationService.getEvaluation(sessionId, studentId),
      evaluationService.getFeedback(sessionId, studentId).catch(() => null),
    ]);
    return { evalData, fbData };
  }, [sessionId, studentId]);

  const { run, isLoading, error } = useAsyncAction(fetchDetails);
  const { run: runSave, isLoading: isSaving } = useAsyncAction(evaluationService.saveEvaluation);

  useEffect(() => {
    if (sessionId && studentId) {
      run().then((res) => {
        if (res.ok) {
          setCriteria(res.data.evalData.criterios);
          setStatus(res.data.evalData.status);
          const map: Record<string, number> = {};
          res.data.evalData.itens.forEach((i) => {
            map[i.criterioId] = i.nota;
          });
          setScores(map);
          if (res.data.fbData) setFeedback(res.data.fbData.texto);
        }
      });
    }
  }, [sessionId, studentId, run]);

  async function performSubmit(justificativa?: string) {
    const itens = criteria.map((c) => ({ criterioId: c.id, nota: scores[c.id] ?? 0 }));
    const result = await runSave(sessionId, studentId, { itens, enviar: true, justificativa });
    if (result.ok) {
      if (feedback.trim()) {
        await evaluationService.saveFeedback(sessionId, studentId, feedback.trim());
      }
      notify({ tone: 'success', message: 'Avaliação enviada com sucesso.' });
      navigate(-1);
    }
  }

  function handleSend() {
    if (status === 'ENVIADA') {
      setIsJustifyOpen(true);
      return;
    }
    performSubmit();
  }

  return (
    <div className="min-h-dvh bg-surface pb-12">
      <EvaluationHeader />
      <main className="mx-auto mt-4 flex w-full max-w-md flex-col gap-4 px-4">
        {isLoading && (
          <div className="mt-12 flex justify-center">
            <Spinner className="size-8 text-brand-900" />
          </div>
        )}
        {error && <Alert tone="error">{error.message}</Alert>}

        {!isLoading && (
          <>
            <CriteriaScoresCard
              studentName="Aluno"
              criteria={criteria}
              scores={scores}
              onScoreChange={(id, val) => setScores((prev) => ({ ...prev, [id]: val }))}
            />
            <QuickObservationsCard complement={complement} onComplementChange={setComplement} />
            <EvaluationFeedbackCard feedback={feedback} onChange={setFeedback} />
            <button
              type="button"
              onClick={handleSend}
              disabled={isSaving}
              className="mt-2 w-full rounded-2xl bg-brand-900 py-3.5 text-base font-bold text-white shadow-lg transition hover:bg-brand-800 active:scale-[0.98]"
            >
              Enviar avaliação e feedback
            </button>
          </>
        )}
      </main>

      <JustificationModal
        isOpen={isJustifyOpen}
        isLoading={isSaving}
        onConfirm={(just) => {
          setIsJustifyOpen(false);
          performSubmit(just);
        }}
        onCancel={() => setIsJustifyOpen(false)}
      />
    </div>
  );
}

export default StudentEvaluationPage;
