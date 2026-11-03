import { Link, useNavigate, useParams } from 'react-router-dom';
import { ChevronRightIcon } from '@heroicons/react/24/outline';
import { BackHeader } from '@/components/layout/BackHeader';
import { Alert } from '@/components/ui/Alert';
import { Spinner } from '@/components/ui/Spinner';
import { FeedbackCard } from './FeedbackCard';
import { FeedbackEmptyState } from './FeedbackEmptyState';
import { useSessionFeedback } from './useSessionFeedback';

export default function SessionFeedbackPage() {
  const { roomId, problemId, sessionId } = useParams<{
    roomId: string;
    problemId: string;
    sessionId: string;
  }>();
  const navigate = useNavigate();
  const { feedback, isLoading, error } = useSessionFeedback(sessionId);

  const backUrl = `/turmas/${roomId}/problemas/${problemId}/sessoes/${sessionId}`;
  const allFeedbacksUrl = `/turmas/${roomId}/problemas/${problemId}/feedbacks`;

  return (
    <div className="min-h-dvh bg-surface pb-12">
      <BackHeader
        title="Feedback da Sessão"
        subtitle="Retorno do tutor"
        onBack={() => navigate(backUrl)}
      />

      <main className="mx-auto mt-6 flex w-full max-w-md flex-col gap-4 px-4 sm:max-w-xl">
        <Link
          to={allFeedbacksUrl}
          className="flex items-center justify-between rounded-2xl border border-black/5 bg-white p-4 shadow-sm transition hover:bg-black/[0.02]"
        >
          <span className="text-sm font-semibold text-brand-900">
            Todos os feedbacks do problema
          </span>
          <ChevronRightIcon className="size-5 text-muted" aria-hidden />
        </Link>

        {isLoading ? (
          <div className="mt-8 flex justify-center">
            <Spinner className="size-8 text-brand-900" />
          </div>
        ) : error ? (
          <Alert tone="error">{error}</Alert>
        ) : feedback ? (
          <FeedbackCard
            autor={feedback.autor}
            texto={feedback.texto}
            criadoEm={feedback.criadoEm}
            editadoEm={feedback.editadoEm}
            novo={feedback.novo}
            nota={feedback.nota}
          />
        ) : (
          <FeedbackEmptyState />
        )}
      </main>
    </div>
  );
}
