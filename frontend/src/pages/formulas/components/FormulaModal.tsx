import { XMarkIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';

type FormulaModalProps = {
  isOpen: boolean;
  title?: string;
  message: string;
  primaryActionLabel: string;
  onPrimaryAction: () => void;
  onClose: () => void;
  isDestructive?: boolean;
  isLoading?: boolean;
};

function ModalCloseButton({ onClose, disabled }: { onClose: () => void; disabled: boolean }) {
  return (
    <button
      type="button"
      onClick={onClose}
      disabled={disabled}
      aria-label="Fechar"
      className="absolute right-4 top-4 rounded-full p-1 text-brand-900 hover:bg-black/5"
    >
      <XMarkIcon className="size-6 border-2 border-brand-900 rounded-full p-0.5" />
    </button>
  );
}

export function FormulaModal(props: FormulaModalProps) {
  const {
    isOpen,
    title,
    message,
    primaryActionLabel,
    onPrimaryAction,
    onClose,
    isDestructive = true,
    isLoading = false,
  } = props;
  if (!isOpen) return null;

  const btnClass = isDestructive
    ? 'bg-danger hover:bg-danger/90 text-white border-transparent px-8 py-2 h-10 rounded-xl font-bold'
    : 'bg-brand-900 px-8 py-2 h-10 rounded-xl font-bold';

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
    >
      <div className="relative w-full max-w-xs sm:max-w-sm rounded-[24px] border-2 border-danger bg-white p-6 shadow-2xl animate-pop-in">
        <ModalCloseButton onClose={onClose} disabled={isLoading} />
        <div className="flex flex-col items-center gap-6 mt-4 text-center">
          <div className="flex flex-col gap-2">
            {title && <h2 className="text-xl font-bold text-ink">{title}</h2>}
            <p className="text-xl text-ink leading-snug">{message}</p>
          </div>
          <Button
            type="button"
            isLoading={isLoading}
            onClick={onPrimaryAction}
            className={btnClass}
          >
            {primaryActionLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
