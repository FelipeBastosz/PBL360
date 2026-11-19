import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { useSessionGeneralEvaluations } from '@/pages/sessions/components/hooks/useSessionGeneralEvaluations';
import { ItemDates } from '@/pages/sessions/components/SessionGeneralEvaluationItem';
import type { SessionGeneralEvaluation } from '@/types/session';

type SessionGeneralEvaluationSectionProps = {
  sessionId?: string;
};

function GeneralEvaluationItem({ evaluation }: { evaluation: SessionGeneralEvaluation }) {
  return (
    <article className="flex flex-col gap-2.5 rounded-xl border border-black/5 bg-surface/40 p-4">
      <header className="flex items-center gap-2.5 min-w-0">
        <UserAvatar
          user={{ id: evaluation.autor.id, nome: evaluation.autor.nome, possuiFoto: false }}
          className="size-8 text-xs"
        />
        <div className="flex flex-col min-w-0">
          <span className="truncate text-sm font-semibold text-ink">{evaluation.autor.nome}</span>
          <ItemDates criadoEm={evaluation.criadoEm} editadoEm={evaluation.editadoEm} />
        </div>
      </header>

      <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-ink/90">
        {evaluation.texto}
      </p>
    </article>
  );
}

function SectionEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-black/5 bg-surface/50 py-4 px-4 text-center">
      <p className="text-sm text-muted">O feedback geral da sessão ainda não está disponível.</p>
    </div>
  );
}

export function SessionGeneralEvaluationSection({
  sessionId,
}: SessionGeneralEvaluationSectionProps) {
  const { evaluations, isLoading, error, reload } = useSessionGeneralEvaluations(sessionId);

  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
      <header>
        <h3 className="text-base font-bold text-brand-900">Feedback Geral da Sessão</h3>
        <p className="mt-0.5 text-xs text-muted">
          Parecer da tutoria sobre o desempenho da turma nesta sessão.
        </p>
      </header>

      {isLoading && (
        <div className="flex justify-center py-6">
          <Spinner className="size-6 text-brand-900" />
        </div>
      )}

      {error && !isLoading && (
        <div className="flex flex-col gap-2">
          <Alert tone="error">{error}</Alert>
          <Button
            type="button"
            variant="outline"
            onClick={reload}
            className="self-start text-xs h-8 px-3"
          >
            Tentar novamente
          </Button>
        </div>
      )}

      {!isLoading && !error && evaluations.length === 0 && <SectionEmptyState />}

      {!isLoading && !error && evaluations.length > 0 && (
        <div className="flex flex-col gap-3">
          {evaluations.map((item) => (
            <GeneralEvaluationItem key={item.id} evaluation={item} />
          ))}
        </div>
      )}
    </section>
  );
}
