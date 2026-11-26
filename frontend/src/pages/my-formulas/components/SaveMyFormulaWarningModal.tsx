import { ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';

type Props = {
  isOpen: boolean;
  isLoading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

function WarningIcon() {
  return (
    <div className="flex size-12 items-center justify-center rounded-full bg-brand-soft text-brand-accent">
      <ExclamationTriangleIcon className="size-7" aria-hidden="true" />
    </div>
  );
}

function WarningBody() {
  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-xl font-bold text-ink">Salvar alterações na fórmula?</h2>
      <div className="mt-2 rounded-xl bg-brand-soft/60 p-3 text-center">
        <p className="text-sm font-medium text-brand-accent leading-relaxed">
          <strong>Atenção:</strong> as alterações serão salvas{' '}
          <strong>apenas na sua fórmula original</strong>. Cópias já associadas ou utilizadas em
          sessões <strong>não serão modificadas</strong>.
        </p>
      </div>
      <p className="mt-1 text-xs text-muted">
        A nova versão da fórmula estará disponível para seleção nas próximas sessões.
      </p>
    </div>
  );
}

export function SaveMyFormulaWarningModal({ isOpen, isLoading, onConfirm, onCancel }: Props) {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
    >
      <div className="relative flex w-full max-w-sm flex-col gap-4 rounded-[24px] bg-elevated p-6 text-center shadow-2xl">
        <button
          type="button"
          onClick={isLoading ? undefined : onCancel}
          disabled={isLoading}
          aria-label="Fechar"
          className="absolute right-4 top-4 rounded-full p-1 text-ink/60 hover:text-ink"
        >
          <XMarkIcon className="size-6" />
        </button>

        <div className="flex flex-col items-center gap-4 text-center">
          <WarningIcon />
          <WarningBody />
          <div className="mt-2 flex w-full flex-col gap-2">
            <Button
              type="button"
              isLoading={isLoading}
              onClick={onConfirm}
              className="bg-brand-primary hover:bg-brand-primary-hover text-white border-transparent"
            >
              Confirmar e salvar
            </Button>
            <Button
              type="button"
              variant="link"
              disabled={isLoading}
              onClick={onCancel}
              className="text-muted hover:text-ink"
            >
              Voltar e revisar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
