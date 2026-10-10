import { useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { EvaluationHeader } from './components/EvaluationHeader';
import { CriteriaScoresCard } from './components/CriteriaScoresCard';
import { QuickObservationsCard } from './components/QuickObservationsCard';
import { EvaluationFeedbackCard } from './components/EvaluationFeedbackCard';
import { JustificationModal } from './components/JustificationModal';
import { useStudentEvaluation } from './hooks/useStudentEvaluation';

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

type MainContentProps = {
  studentName: string;
  state: ReturnType<typeof useStudentEvaluation>;
  onSend: () => void;
  moreTagsUrl: string;
};

function EvaluationMainContent({ studentName, state, onSend, moreTagsUrl }: MainContentProps) {
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
        onScoreChange={state.handleScoreChange}
      />
      <QuickObservationsCard
        tags={state.tags}
        counts={state.counts}
        onIncrement={state.handleTagClick}
        onDecrement={state.handleTagDecrement}
        moreTagsUrl={moreTagsUrl}
        studentName={studentName}
      />
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
  const [isJustifyOpen, setIsJustifyOpen] = useState(false);

  const state = useStudentEvaluation(sessionId, studentId);

  const handleSend = () =>
    state.status === 'ENVIADA' ? setIsJustifyOpen(true) : state.submitEvaluation(true);

  const handleJustifyConfirm = (just: string) => {
    setIsJustifyOpen(false);
    state.submitEvaluation(true, just);
  };

  const moreTagsUrl = `${location.pathname}/marcacoes`;

  return (
    <div className="min-h-dvh bg-surface pb-12">
      <EvaluationHeader />
      <main className="mx-auto mt-4 flex w-full max-w-md flex-col gap-4 px-4">
        {state.error && <Alert tone="error">{state.error.message}</Alert>}
        <EvaluationMainContent
          studentName={studentName}
          state={state}
          onSend={handleSend}
          moreTagsUrl={moreTagsUrl}
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
