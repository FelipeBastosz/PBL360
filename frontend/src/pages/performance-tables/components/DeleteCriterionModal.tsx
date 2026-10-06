import { XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';

type Props = {
  isOpen: boolean;
  criterionName: string;
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

export function DeleteCriterionModal({ isOpen, criterionName, onConfirm, onCancel }: Props) {
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
          onClick={onCancel}
          aria-label="Fechar confirmação"
          className="absolute right-4 top-4 rounded-full p-1 text-ink/60 hover:text-ink"
        >
          <XMarkIcon className="size-6" />
        </button>

        <div className="flex flex-col items-center gap-4 text-center">
          <DeleteIcon />
          <div className="flex flex-col gap-2">
            <h2 className="text-xl font-bold text-ink">Excluir critério?</h2>
            <p className="text-base font-semibold text-brand-900">{criterionName}</p>
            <div className="mt-2 rounded-xl bg-danger/10 p-3 text-center">
              <p className="text-sm font-medium text-danger leading-relaxed">
                Atenção: remover este critério irá desvinculá-lo desta fórmula ao salvar a edição.
              </p>
            </div>
          </div>
          <div className="mt-2 flex w-full flex-col gap-2">
            <Button
              type="button"
              onClick={onConfirm}
              className="bg-danger hover:bg-danger/90 text-white border-transparent"
            >
              Sim, excluir critério
            </Button>
            <Button
              type="button"
              variant="link"
              onClick={onCancel}
              className="text-muted hover:text-ink"
            >
              Cancelar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
