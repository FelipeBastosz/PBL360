import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { useSessionGeneralEvaluations } from '@/pages/sessions/components/hooks/useSessionGeneralEvaluations';
import type { SessionGeneralEvaluation } from '@/types/session';
import { FeedbackCard } from './FeedbackCard';

type SessionGeneralEvaluationSectionProps = {
  sessionId?: string;
  evaluations?: SessionGeneralEvaluation[];
};

function GeneralEvaluationsList({ evaluations }: { evaluations: SessionGeneralEvaluation[] }) {
  return (
    <section aria-label="Feedback da Turma" className="flex flex-col gap-2">
      <h2 className="text-sm font-semibold text-brand-accent uppercase tracking-wider">DA TURMA</h2>
      <div className="flex flex-col gap-3">
        {evaluations.map((item) => {
          const isEdited = Boolean(item.editadoEm && item.editadoEm !== item.criadoEm);
          return (
            <FeedbackCard
              key={item.id}
              autor={item.autor}
              texto={item.texto}
              criadoEm={item.criadoEm}
              editadoEm={isEdited ? item.editadoEm : null}
            />
          );
        })}
      </div>
    </section>
  );
}

export function SessionGeneralEvaluationSection({
  sessionId,
  evaluations: evaluationsProp,
}: SessionGeneralEvaluationSectionProps) {
  const {
    evaluations: fetched,
    isLoading,
    error,
    reload,
  } = useSessionGeneralEvaluations(evaluationsProp ? undefined : sessionId);

  const evaluations = evaluationsProp ?? fetched;

  if (isLoading && !evaluationsProp) {
    return (
      <div className="flex justify-center py-6">
        <Spinner className="size-6 text-brand-accent" />
      </div>
    );
  }

  if (error && !evaluationsProp) {
    return (
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
    );
  }

  if (evaluations.length === 0) return null;

  return <GeneralEvaluationsList evaluations={evaluations} />;
}
