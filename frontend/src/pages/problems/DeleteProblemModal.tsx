import { XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { useEscapeKey } from '@/hooks/useEscapeKey';
import type { ProblemDeletionImpact } from '@/types/problem';

type DeleteModalProps = {
  problemTitle: string;
  impact: ProblemDeletionImpact | null;
  isOpen: boolean;
  isLoading: boolean;
  errorMessage?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
};

function DeleteIcon() {
  return (
    <div className="flex size-12 items-center justify-center rounded-full bg-danger/10 text-danger">
      <ExclamationTriangleIcon className="size-7" aria-hidden="true" />
    </div>
  );
}

function ImpactDescription({ impact }: { impact: ProblemDeletionImpact | null }) {
  if (impact === null) {
    return (
      <div className="mt-2 rounded-xl bg-danger/10 p-3 text-center">
        <p className="text-sm font-medium text-danger leading-relaxed animate-pulse">
          Carregando impacto da exclusão...
        </p>
      </div>
    );
  }

  if (impact.sessoes > 0) {
    return (
      <div className="mt-2 rounded-xl bg-danger/10 p-3 text-center">
        <p className="text-sm font-medium text-danger leading-relaxed">
          Este problema possui{' '}
          <strong>
            {impact.sessoes} {impact.sessoes === 1 ? 'sessão vinculada' : 'sessões vinculadas'}
          </strong>
          {impact.avaliacoes > 0 || impact.notas > 0 ? (
            <>
              {' '}
              com <strong>{impact.avaliacoes} avaliações</strong> e{' '}
              <strong>{impact.notas} notas</strong> registradas.
            </>
          ) : null}
          . Não é possível excluí-lo enquanto houver sessões associadas. Remova as sessões primeiro.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-2 rounded-xl bg-danger/10 p-3 text-center">
      <p className="text-sm font-medium text-danger leading-relaxed">
        Atenção: esta ação é irreversível e excluirá permanentemente este problema da turma.
      </p>
    </div>
  );
}

function ModalActions({
  isBlocked,
  isLoading,
  onConfirm,
  onCancel,
}: {
  isBlocked: boolean;
  isLoading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (isBlocked) {
    return (
      <div className="mt-2 flex w-full flex-col gap-2">
        <Button
          type="button"
          onClick={onCancel}
          className="h-12 w-full rounded-xl bg-brand-900 text-white hover:bg-brand-700"
        >
          Entendi
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-2 flex w-full flex-col gap-2">
      <Button
        type="button"
        isLoading={isLoading}
        onClick={onConfirm}
        className="bg-danger hover:bg-danger/90 focus-visible:outline-danger text-white border-transparent"
      >
        Sim, excluir problema
      </Button>
      <Button
        type="button"
        variant="link"
        disabled={isLoading}
        onClick={onCancel}
        className="text-muted hover:text-ink"
      >
        Cancelar
      </Button>
    </div>
  );
}

function ProblemModalContent({
  problemTitle,
  impact,
  errorMessage,
}: {
  problemTitle: string;
  impact: ProblemDeletionImpact | null;
  errorMessage?: string | null;
}) {
  const hasSessions = (impact?.sessoes ?? 0) > 0;
  const isBlocked = hasSessions || Boolean(errorMessage);
  const title = isBlocked ? 'Não é possível excluir o problema' : 'Excluir problema?';

  return (
    <div className="flex flex-col gap-2">
      <h2 id="delete-problem-title" className="text-xl font-bold text-ink">
        {title}
      </h2>
      <p className="text-base font-semibold break-words text-brand-900">{problemTitle}</p>
      {errorMessage ? (
        <div role="alert" className="mt-2 rounded-xl bg-danger/10 p-3 text-center">
          <p className="text-sm font-medium text-danger leading-relaxed">{errorMessage}</p>
        </div>
      ) : (
        <ImpactDescription impact={impact} />
      )}
    </div>
  );
}

export function DeleteProblemModal({
  problemTitle,
  impact,
  isOpen,
  isLoading,
  errorMessage,
  onConfirm,
  onCancel,
}: DeleteModalProps) {
  useEscapeKey(isOpen, onCancel, isLoading);
  if (!isOpen) return null;

  const isBlocked = (impact?.sessoes ?? 0) > 0 || Boolean(errorMessage);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-problem-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fade-in"
    >
      <div className="relative max-h-full w-full max-w-sm overflow-y-auto rounded-[24px] border-2 border-danger bg-white p-6 shadow-2xl animate-pop-in">
        <button
          type="button"
          onClick={isLoading ? undefined : onCancel}
          disabled={isLoading}
          aria-label="Fechar confirmação"
          className="absolute right-4 top-4 rounded-full p-1 text-ink/60 hover:bg-black/5 hover:text-ink focus-visible:outline-2 focus-visible:outline-brand-900"
        >
          <XMarkIcon className="size-6" />
        </button>

        <div className="flex flex-col items-center gap-4 text-center">
          <DeleteIcon />
          <ProblemModalContent
            problemTitle={problemTitle}
            impact={impact}
            errorMessage={errorMessage}
          />
          <ModalActions
            isBlocked={isBlocked}
            isLoading={isLoading}
            onConfirm={onConfirm}
            onCancel={onCancel}
          />
        </div>
      </div>
    </div>
  );
}
