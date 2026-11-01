import { useNavigate, useParams } from 'react-router-dom';
import { BackHeader } from '@/components/layout/BackHeader';
import { Alert } from '@/components/ui/Alert';
import { Spinner } from '@/components/ui/Spinner';
import { FeedbackCard } from './FeedbackCard';
import { FeedbackEmptyState } from './FeedbackEmptyState';
import { GeneralFeedbackSection, IndividualFeedbackSection } from './ProblemFeedbackSections';
import { useProblemFeedbacks } from './useProblemFeedbacks';
import type { ReceivedProblemFeedbacksResponse, ReceivedSessionFeedback } from '@/types/feedback';

function SessionItem({ item }: { item: ReceivedSessionFeedback }) {
  if (!item.feedback) {
    return (
      <div className="flex flex-col gap-2 rounded-2xl border border-dashed border-black/10 bg-white p-4">
        <span className="text-xs font-semibold text-muted uppercase tracking-wider">
          {item.rotulo}
        </span>
        <p className="text-sm text-muted">Feedback ainda não disponível para esta sessão.</p>
      </div>
    );
  }
  return (
    <FeedbackCard
      autor={item.feedback.autor}
      texto={item.feedback.texto}
      criadoEm={item.feedback.criadoEm}
      editadoEm={item.feedback.editadoEm}
      novo={item.feedback.novo}
      nota={item.feedback.nota}
      tag={item.rotulo}
    />
  );
}

function FeedbacksList({ data }: { data: ReceivedProblemFeedbacksResponse }) {
  return (
    <div className="flex flex-col gap-6">
      {typeof data.notaFinal === 'number' && Number.isFinite(data.notaFinal) && (
        <section aria-label="Nota Final" className="flex justify-end">
          <span
            data-testid="feedback-nota-final"
            className="rounded-lg border border-brand-200 bg-brand-50 px-2.5 py-1 text-xs font-bold text-brand-900"
          >
            Nota final {data.notaFinal.toFixed(1)}
          </span>
        </section>
      )}
      {data.individual && <IndividualFeedbackSection feedback={data.individual} />}
      {data.geral && <GeneralFeedbackSection feedback={data.geral} />}
      {data.sessoes.length > 0 && (
        <section aria-label="Feedbacks por Sessão" className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-brand-900 uppercase tracking-wider">
            Por Sessão
          </h2>
          <div className="flex flex-col gap-3">
            {data.sessoes.map((item) => (
              <SessionItem key={item.sessaoId} item={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default function ProblemFeedbacksPage() {
  const { roomId, problemId } = useParams<{ roomId: string; problemId: string }>();
  const navigate = useNavigate();
  const { data, isLoading, error } = useProblemFeedbacks(roomId, problemId);
  const isEmpty =
    !data?.individual &&
    !data?.geral &&
    (!data?.sessoes || data.sessoes.length === 0) &&
    (typeof data?.notaFinal !== 'number' || !Number.isFinite(data.notaFinal));

  return (
    <div className="min-h-dvh bg-surface pb-12">
      <BackHeader
        title="Feedbacks do Problema"
        subtitle="Histórico completo"
        onBack={() => navigate(`/turmas/${roomId}/problemas/${problemId}`)}
      />
      <main className="mx-auto mt-6 flex w-full max-w-md flex-col gap-6 px-4 sm:max-w-xl">
        {isLoading ? (
          <div className="mt-8 flex justify-center">
            <Spinner className="size-8 text-brand-900" />
          </div>
        ) : error ? (
          <Alert tone="error">{error}</Alert>
        ) : isEmpty || !data ? (
          <FeedbackEmptyState message="Nenhum feedback disponível para este problema ainda." />
        ) : (
          <FeedbacksList data={data} />
        )}
      </main>
    </div>
  );
}
