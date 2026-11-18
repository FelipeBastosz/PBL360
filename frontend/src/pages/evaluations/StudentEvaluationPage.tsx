import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { planningPokerService } from '@/services/planningPoker.service';
import { isFeedbackOverLimit } from '@/utils/feedbackTemplates';
import { EvaluationHeader } from './components/EvaluationHeader';
import { CriteriaScoresCard } from './components/CriteriaScoresCard';
import { QuickObservationsCard } from './components/QuickObservationsCard';
import { EvaluationFeedbackCard } from './components/EvaluationFeedbackCard';
import { JustificationModal } from './components/JustificationModal';
import { useStudentEvaluation } from './hooks/useStudentEvaluation';
import { PAGE_CONTAINER_CLASS } from '@/components/ui/cardStyles';
import { cn } from '@/utils/cn';

function EvaluationActionButtons({
  onSend,
  onDraft,
  isSaving,
  isEnviada,
  isBlocked,
  isOverLimit = false,
}: {
  onSend: () => void;
  onDraft: () => void;
  isSaving: boolean;
  isEnviada: boolean;
  isBlocked?: boolean;
  isOverLimit?: boolean;
}) {
  return (
    <div className="mt-2 flex flex-col gap-2.5">
      <button
        type="button"
        onClick={onSend}
        disabled={isSaving || isBlocked || isOverLimit}
        className="w-full rounded-2xl bg-brand-900 py-3.5 text-base font-bold text-white shadow-lg transition hover:bg-brand-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
      >
        Enviar avaliação e feedback
      </button>
      <button
        type="button"
        onClick={onDraft}
        disabled={isSaving || isEnviada || isBlocked || isOverLimit}
        className="w-full rounded-2xl border border-brand-900 bg-white py-3 text-sm font-bold text-brand-900 transition hover:bg-brand-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
      >
        Salvar rascunho
      </button>
      {isEnviada && (
        <p className="text-center text-xs text-muted">
          Esta avaliação já foi enviada. Não é permitido salvá-la como rascunho.
        </p>
      )}
    </div>
  );
}

type MainContentProps = {
  studentName: string;
  state: ReturnType<typeof useStudentEvaluation>;
  isPokerActive: boolean;
  onSend: () => void;
  onNavigateMoreTags: () => void;
};

function EvaluationCards({
  studentName,
  state,
  onNavigateMoreTags,
}: {
  studentName: string;
  state: ReturnType<typeof useStudentEvaluation>;
  onNavigateMoreTags: () => void;
}) {
  return (
    <>
      <CriteriaScoresCard
        studentName={studentName}
        papel={state.papel}
        formula={state.formula}
        criteria={state.criteria}
        scores={state.scores}
        notaCargo={state.notaCargo}
        onScoreChange={state.handleScoreChange}
        onCargoScoreChange={state.papel ? state.setNotaCargo : undefined}
      />
      <QuickObservationsCard
        tags={state.tags}
        counts={state.counts}
        onIncrement={state.handleTagClick}
        onDecrement={state.handleTagDecrement}
        onNavigateMoreTags={onNavigateMoreTags}
      />
    </>
  );
}

function EvaluationMainContent({
  studentName,
  state,
  isPokerActive,
  onSend,
  onNavigateMoreTags,
}: MainContentProps) {
  if (state.isLoading) {
    return (
      <div className="mt-12 flex justify-center">
        <Spinner className="size-8 text-brand-900" />
      </div>
    );
  }

  const isFeedbackDisabled = state.isSaving || state.isLoading || isPokerActive;
  const isOverLimit = isFeedbackOverLimit(state.feedback);
  const handleDraft = () => !isOverLimit && state.submitEvaluation(false);

  return (
    <>
      <EvaluationCards
        studentName={studentName}
        state={state}
        onNavigateMoreTags={onNavigateMoreTags}
      />
      <EvaluationFeedbackCard
        feedback={state.feedback}
        onChange={state.setFeedback}
        disabled={isFeedbackDisabled}
      />
      <EvaluationActionButtons
        onSend={onSend}
        onDraft={handleDraft}
        isSaving={state.isSaving}
        isEnviada={state.status === 'ENVIADA'}
        isBlocked={isPokerActive}
        isOverLimit={isOverLimit}
      />
    </>
  );
}

function useActivePokerStatus(sessionId: string) {
  const [isPokerActive, setIsPokerActive] = useState(false);
  useEffect(() => {
    if (!sessionId) return;
    planningPokerService
      .getAvailability(sessionId)
      .then((res) => setIsPokerActive(Boolean(res.pokerAbertoId)))
      .catch(() => setIsPokerActive(false));
  }, [sessionId]);
  return isPokerActive;
}

export function StudentEvaluationPage() {
  const { sessionId = '', studentId = '' } = useParams<{ sessionId: string; studentId: string }>();
  const location = useLocation();
  const studentName = (location.state as { studentName?: string })?.studentName || 'Aluno';
  const [isJustifyOpen, setIsJustifyOpen] = useState(false);

  const state = useStudentEvaluation(sessionId, studentId);
  const isPokerActive = useActivePokerStatus(sessionId);

  const handleSend = () => {
    if (isPokerActive || isFeedbackOverLimit(state.feedback)) return;
    return state.status === 'ENVIADA' ? setIsJustifyOpen(true) : state.submitEvaluation(true);
  };

  const handleJustifyConfirm = (just: string) => {
    setIsJustifyOpen(false);
    state.submitEvaluation(true, just);
  };

  const moreTagsUrl = `${location.pathname}/marcacoes`;
  const handleOpenMoreTags = () => {
    state.saveDraftAndNavigate(moreTagsUrl, { studentName });
  };

  return (
    <div className="min-h-dvh bg-surface pb-12">
      <EvaluationHeader />
      <main className={cn(PAGE_CONTAINER_CLASS, 'mt-4 flex flex-col gap-4')}>
        {state.error && <Alert tone="error">{state.error.message}</Alert>}
        {isPokerActive && (
          <Alert tone="info">
            A avaliação direta do tutor está bloqueada enquanto o planning poker estiver ativo nesta
            sessão.
          </Alert>
        )}
        <EvaluationMainContent
          studentName={studentName}
          state={state}
          isPokerActive={isPokerActive}
          onSend={handleSend}
          onNavigateMoreTags={handleOpenMoreTags}
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
