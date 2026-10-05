import { XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';

type Props = {
  isOpen: boolean;
  formulaTitle: string;
  isLoading: boolean;
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

function ModalBody({ formulaTitle }: { formulaTitle: string }) {
  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-xl font-bold text-ink">Excluir fórmula?</h2>
      <p className="text-base font-semibold text-brand-900">{formulaTitle}</p>
      <div className="mt-2 rounded-xl bg-danger/10 p-3 text-center">
        <p className="text-sm font-medium text-danger leading-relaxed">
          Atenção: esta ação é irreversível e excluirá permanentemente esta fórmula de avaliação.
        </p>
      </div>
    </div>
  );
}

function ModalActions({
  isLoading,
  onConfirm,
  onCancel,
}: {
  isLoading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="mt-2 flex w-full flex-col gap-2">
      <Button
        type="button"
        isLoading={isLoading}
        onClick={onConfirm}
        className="bg-danger hover:bg-danger/90 text-white border-transparent"
      >
        Sim, excluir fórmula
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

export function DeletePerformanceTableModal({
  isOpen,
  formulaTitle,
  isLoading,
  onConfirm,
  onCancel,
}: Props) {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
    >
      <div className="relative w-full max-w-sm rounded-[24px] border-2 border-danger bg-white p-6 shadow-2xl">
        <button
          type="button"
          onClick={isLoading ? undefined : onCancel}
          disabled={isLoading}
          aria-label="Fechar confirmação"
          className="absolute right-4 top-4 rounded-full p-1 text-ink/60 hover:text-ink"
        >
          <XMarkIcon className="size-6" />
        </button>

        <div className="flex flex-col items-center gap-4 text-center">
          <DeleteIcon />
          <ModalBody formulaTitle={formulaTitle} />
          <ModalActions isLoading={isLoading} onConfirm={onConfirm} onCancel={onCancel} />
        </div>
      </div>
    </div>
  );
}
