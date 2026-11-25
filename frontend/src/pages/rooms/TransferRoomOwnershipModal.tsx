import { UserPlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { useEscapeKey } from '@/hooks/useEscapeKey';

type TransferRoomOwnershipModalProps = {
  isOpen: boolean;
  targetTutorName: string;
  isLoading: boolean;
  errorMessage?: string | null;
  onConfirm: () => void;
  onClose: () => void;
};

function ModalIcon() {
  return (
    <div className="flex size-12 items-center justify-center rounded-full bg-brand-50 text-brand-900">
      <UserPlusIcon className="size-6" aria-hidden="true" />
    </div>
  );
}

function ModalContent({
  targetTutorName,
  errorMessage,
}: {
  targetTutorName: string;
  errorMessage?: string | null;
}) {
  return (
    <>
      <ModalIcon />
      <h2 id="transfer-ownership-title" className="text-xl font-bold text-ink">
        Transferir propriedade?
      </h2>
      <p className="text-base font-semibold text-brand-900">{targetTutorName}</p>
      <div className="rounded-xl bg-surface p-3 text-center">
        <p className="text-xs text-muted leading-relaxed">
          Você deixará de ser o responsável principal desta turma e passará a atuar como{' '}
          <strong className="text-ink">co-tutor</strong>. O novo responsável assumirá a gestão da
          turma.
        </p>
      </div>
      {errorMessage && (
        <div role="alert" className="w-full rounded-xl bg-danger/10 p-3 text-center">
          <p className="text-xs font-medium text-danger leading-relaxed">{errorMessage}</p>
        </div>
      )}
    </>
  );
}

function ModalActions({
  isLoading,
  onConfirm,
  onClose,
}: {
  isLoading: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <div className="mt-4 flex w-full flex-col gap-2">
      <Button
        type="button"
        isLoading={isLoading}
        onClick={onConfirm}
        className="w-full bg-brand-900 text-white hover:bg-brand-800"
      >
        Confirmar transferência
      </Button>
      <Button
        type="button"
        variant="link"
        disabled={isLoading}
        onClick={onClose}
        className="text-muted hover:text-ink"
      >
        Cancelar
      </Button>
    </div>
  );
}

export function TransferRoomOwnershipModal({
  isOpen,
  targetTutorName,
  isLoading,
  errorMessage,
  onConfirm,
  onClose,
}: TransferRoomOwnershipModalProps) {
  useEscapeKey(isOpen, onClose, isLoading);
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="transfer-ownership-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fade-in"
    >
      <div className="relative max-h-full w-full max-w-sm overflow-y-auto rounded-[24px] border border-black/5 bg-white p-6 shadow-2xl animate-pop-in">
        <button
          type="button"
          onClick={isLoading ? undefined : onClose}
          disabled={isLoading}
          aria-label="Fechar confirmação"
          className="absolute right-4 top-4 rounded-full p-1 text-ink/60 hover:bg-black/5 hover:text-ink focus-visible:outline-2 focus-visible:outline-brand-900"
        >
          <XMarkIcon className="size-6" />
        </button>

        <div className="flex flex-col items-center gap-3 text-center">
          <ModalContent targetTutorName={targetTutorName} errorMessage={errorMessage} />
          <ModalActions isLoading={isLoading} onConfirm={onConfirm} onClose={onClose} />
        </div>
      </div>
    </div>
  );
}
