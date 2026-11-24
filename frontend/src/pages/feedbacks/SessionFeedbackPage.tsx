import { Link, useNavigate, useParams } from 'react-router-dom';
import { ChevronRightIcon } from '@heroicons/react/24/outline';
import { BackHeader } from '@/components/layout/BackHeader';
import { PAGE_CONTAINER_CLASS } from '@/components/ui/cardStyles';
import { Alert } from '@/components/ui/Alert';
import { Spinner } from '@/components/ui/Spinner';
import type { ReceivedFeedbackResponse, ReceivedSessionFeedback } from '@/types/feedback';
import type { SessionGeneralEvaluation } from '@/types/session';
import { FeedbackCard } from './FeedbackCard';
import { FeedbackEmptyState } from './FeedbackEmptyState';
import { EvaluationComponentGrades } from './EvaluationComponentGrades';
import { useProblemFeedbacks } from './useProblemFeedbacks';
import { useSessionFeedback } from './useSessionFeedback';
import { useSessionGeneralEvaluations } from '@/pages/sessions/components/hooks/useSessionGeneralEvaluations';
import { SessionGeneralEvaluationSection } from './SessionGeneralEvaluationSection';
import { cn } from '@/utils/cn';

type IndividualFeedbackSectionProps = {
  feedback: ReceivedFeedbackResponse | null;
  sessionGrades?: ReceivedSessionFeedback | null;
};

function IndividualFeedbackSection({ feedback, sessionGrades }: IndividualFeedbackSectionProps) {
  if (feedback) {
    return (
      <section aria-label="Feedback Individual" className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-brand-accent uppercase tracking-wider">
          INDIVIDUAL
        </h2>
        <FeedbackCard
          autor={feedback.autor}
          texto={feedback.texto}
          criadoEm={feedback.criadoEm}
          editadoEm={feedback.editadoEm}
          novo={feedback.novo}
          nota={feedback.nota}
          avaliacoes={feedback.avaliacoes}
        />
      </section>
    );
  }

  if (sessionGrades?.avaliacoes) {
    return (
      <section aria-label="Feedback Individual" className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-brand-accent uppercase tracking-wider">
          INDIVIDUAL
        </h2>
        <div className="flex flex-col gap-2 rounded-2xl border border-border-subtle bg-elevated p-5 shadow-sm">
          <EvaluationComponentGrades avaliacoes={sessionGrades.avaliacoes} />
        </div>
      </section>
    );
  }

  return null;
}

function ProblemFeedbacksNav({ url }: { url: string }) {
  return (
    <Link
      to={url}
      className="flex items-center justify-between rounded-2xl border border-border-subtle bg-elevated p-4 shadow-sm transition hover:bg-black/[0.02]"
    >
      <span className="text-sm font-semibold text-brand-accent">
        Todos os feedbacks do problema
      </span>
      <ChevronRightIcon className="size-5 text-muted" aria-hidden />
    </Link>
  );
}

type FeedbackPageBodyProps = {
  isPageLoading: boolean;
  pageError: string | null;
  isEmpty: boolean;
  hasGeneral: boolean;
  hasIndividual: boolean;
  evaluations: SessionGeneralEvaluation[];
  feedback: ReceivedFeedbackResponse | null;
  sessionGrades?: ReceivedSessionFeedback | null;
};

function FeedbackPageBody(props: FeedbackPageBodyProps) {
  if (props.isPageLoading) {
    return (
      <div className="mt-8 flex justify-center">
        <Spinner className="size-8 text-brand-accent" />
      </div>
    );
  }
  if (props.pageError) return <Alert tone="error">{props.pageError}</Alert>;
  if (props.isEmpty) return <FeedbackEmptyState />;

  return (
    <>
      {props.hasGeneral && <SessionGeneralEvaluationSection evaluations={props.evaluations} />}
      {props.hasIndividual && (
        <IndividualFeedbackSection feedback={props.feedback} sessionGrades={props.sessionGrades} />
      )}
    </>
  );
}

export default function SessionFeedbackPage() {
  const { roomId, problemId, sessionId } = useParams<{
    roomId: string;
    problemId: string;
    sessionId: string;
  }>();
  const navigate = useNavigate();
  const { feedback, isLoading, error } = useSessionFeedback(sessionId);
  const {
    evaluations,
    isLoading: isGenLoading,
    error: genError,
  } = useSessionGeneralEvaluations(sessionId);

  const needsFallback = !isLoading && !error && !feedback;
  const { data: problemData } = useProblemFeedbacks(
    needsFallback ? roomId : undefined,
    needsFallback ? problemId : undefined,
  );
  const sessionGrades = problemData?.sessoes.find((item) => item.sessaoId === sessionId);

  return (
    <div className="min-h-dvh bg-surface pb-12">
      <BackHeader
        title="Feedback da Sessão"
        subtitle="Retorno do tutor"
        onBack={() => navigate(`/turmas/${roomId}/problemas/${problemId}/sessoes/${sessionId}`)}
      />
      <main className={cn(PAGE_CONTAINER_CLASS, 'mt-6 flex flex-col gap-6')}>
        <ProblemFeedbacksNav url={`/turmas/${roomId}/problemas/${problemId}/feedbacks`} />
        <FeedbackPageBody
          isPageLoading={isLoading || isGenLoading}
          pageError={error || genError}
          isEmpty={!evaluations?.length && !feedback && !sessionGrades?.avaliacoes}
          hasGeneral={Boolean(evaluations?.length)}
          hasIndividual={Boolean(feedback || sessionGrades?.avaliacoes)}
          evaluations={evaluations}
          feedback={feedback}
          sessionGrades={sessionGrades}
        />
      </main>
    </div>
  );
}
