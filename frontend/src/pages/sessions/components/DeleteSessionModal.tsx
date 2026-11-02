import { XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { useEscapeKey } from '@/hooks/useEscapeKey';
import type { SessionDeletionImpact } from '@/types/session';

type DeleteModalProps = {
  sessionTitle: string;
  impact: SessionDeletionImpact | null;
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
        Sim, excluir sessão
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

function SessionModalContent({
  sessionTitle,
  impact,
  errorMessage,
}: {
  sessionTitle: string;
  impact: SessionDeletionImpact | null;
  errorMessage?: string | null;
}) {
  const title = errorMessage ? 'Não é possível excluir a sessão' : 'Excluir sessão?';

  return (
    <div className="flex flex-col gap-2">
      <h2 id="delete-session-title" className="text-xl font-bold text-ink">
        {title}
      </h2>
      <p className="text-base font-semibold break-words text-brand-900">{sessionTitle}</p>
      {errorMessage ? (
        <div role="alert" className="mt-2 rounded-xl bg-danger/10 p-3 text-center">
          <p className="text-sm font-medium text-danger leading-relaxed">{errorMessage}</p>
        </div>
      ) : (
        <div className="mt-2 rounded-xl bg-danger/10 p-3 text-center">
          <p className="text-sm font-medium text-danger leading-relaxed">
            Atenção: esta ação é irreversível e excluirá permanentemente esta sessão e todos os seus
            dados vinculados:
            <strong> {impact?.papeis ?? 0} papéis atribuídos</strong>,
            <strong> {impact?.chamada ?? 0} registros de chamada</strong> e
            <strong> {impact?.avaliacoes ?? 0} avaliações</strong>.
          </p>
        </div>
      )}
    </div>
  );
}

export function DeleteSessionModal({
  sessionTitle,
  impact,
  isOpen,
  isLoading,
  errorMessage,
  onConfirm,
  onCancel,
}: DeleteModalProps) {
  useEscapeKey(isOpen, onCancel, isLoading);
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-session-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
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
          <SessionModalContent
            sessionTitle={sessionTitle}
            impact={impact}
            errorMessage={errorMessage}
          />
          <ModalActions
            isBlocked={Boolean(errorMessage)}
            isLoading={isLoading}
            onConfirm={onConfirm}
            onCancel={onCancel}
          />
        </div>
      </div>
    </div>
  );
}
