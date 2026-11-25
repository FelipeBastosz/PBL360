import { ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { useEscapeKey } from '@/hooks/useEscapeKey';

export type TransferRoomConfirmModalProps = {
  isOpen: boolean;
  onClose: () => void;
  targetTutorName: string;
  isLoading: boolean;
  errorMessage?: string | null;
  onConfirm: () => void;
};

function ConfirmIcon() {
  return (
    <div className="flex size-12 items-center justify-center rounded-full bg-amber-100 text-amber-700">
      <ExclamationTriangleIcon className="size-7" aria-hidden="true" />
    </div>
  );
}

function ConfirmContent({
  targetTutorName,
  errorMessage,
}: {
  targetTutorName: string;
  errorMessage?: string | null;
}) {
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <ConfirmIcon />
      <h2 id="transfer-confirm-title" className="text-xl font-bold text-ink">
        Confirmar transferência
      </h2>
      <p className="text-base font-semibold text-brand-900">{targetTutorName}</p>
      <div className="rounded-xl bg-surface p-3 text-center">
        <p className="text-xs text-muted leading-relaxed">
          Tem certeza que deseja transferir a propriedade da turma? Você passará a atuar como{' '}
          <strong className="text-ink">co-tutor</strong> e não poderá desfazer esta ação sozinho.
        </p>
      </div>
      {errorMessage && (
        <Alert tone="error" className="w-full text-xs">
          {errorMessage}
        </Alert>
      )}
    </div>
  );
}

function ConfirmActions({
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

export function TransferRoomConfirmModal({
  isOpen,
  onClose,
  targetTutorName,
  isLoading,
  errorMessage,
  onConfirm,
}: TransferRoomConfirmModalProps) {
  useEscapeKey(isOpen, onClose, isLoading);
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="transfer-confirm-title"
      className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fade-in"
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
        <ConfirmContent targetTutorName={targetTutorName} errorMessage={errorMessage} />
        <ConfirmActions isLoading={isLoading} onConfirm={onConfirm} onClose={onClose} />
      </div>
    </div>
  );
}
