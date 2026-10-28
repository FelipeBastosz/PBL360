import { XMarkIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';

export type ConfirmationModalProps = {
  isOpen: boolean;
  isLoading?: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onClose: () => void;
};

type ModalActionsProps = {
  isLoading: boolean;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onClose: () => void;
};

function ModalActions({
  isLoading,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onClose,
}: ModalActionsProps) {
  return (
    <div className="mt-6 flex w-full flex-col gap-2">
      <Button
        type="button"
        isLoading={isLoading}
        onClick={onConfirm}
        className="w-full shadow-none hover:shadow-none active:shadow-none"
      >
        {confirmLabel}
      </Button>
      <Button
        type="button"
        variant="link"
        disabled={isLoading}
        onClick={onClose}
        className="text-muted hover:text-ink"
      >
        {cancelLabel}
      </Button>
    </div>
  );
}

export function ConfirmationModal({
  isOpen,
  isLoading = false,
  title,
  description,
  confirmLabel = 'Confirmar Envio',
  cancelLabel = 'Cancelar',
  onConfirm,
  onClose,
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirmation-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-fade-in"
    >
      <div className="relative flex w-full max-w-md flex-col rounded-3xl bg-white p-6 shadow-2xl animate-pop-in">
        <div className="flex items-center justify-between gap-3">
          <h2 id="confirmation-modal-title" className="text-xl font-semibold text-ink text-left">
            {title}
          </h2>
          <button
            type="button"
            onClick={isLoading ? undefined : onClose}
            disabled={isLoading}
            aria-label="Fechar confirmação"
            className="-mr-2 rounded-full p-2 text-muted transition-[background-color,scale] duration-200 hover:bg-black/5 active:scale-90 focus-visible:outline-2 focus-visible:outline-brand-900"
          >
            <XMarkIcon className="size-6" />
          </button>
        </div>

        <p className="mt-3 text-left text-sm leading-relaxed text-muted">{description}</p>

        <ModalActions
          isLoading={isLoading}
          confirmLabel={confirmLabel}
          cancelLabel={cancelLabel}
          onConfirm={onConfirm}
          onClose={onClose}
        />
      </div>
    </div>
  );
}
