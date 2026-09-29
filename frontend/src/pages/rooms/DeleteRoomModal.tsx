import { XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';

type DeleteRoomModalProps = {
  roomName: string;
  isOpen: boolean;
  isLoading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

type ModalActionsProps = {
  isLoading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

function ModalActions({ isLoading, onConfirm, onCancel }: ModalActionsProps) {
  return (
    <div className="mt-2 flex w-full flex-col gap-2">
      <Button
        type="button"
        isLoading={isLoading}
        onClick={onConfirm}
        className="bg-danger hover:bg-danger/90 focus-visible:outline-danger text-white border-transparent"
      >
        Sim, excluir turma
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

export function DeleteRoomModal({
  roomName,
  isOpen,
  isLoading,
  onConfirm,
  onCancel,
}: DeleteRoomModalProps) {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-room-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
    >
      <div className="relative w-full max-w-sm rounded-[24px] border-2 border-danger bg-white p-6 shadow-2xl animate-pop-in">
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
          <div className="flex size-12 items-center justify-center rounded-full bg-danger/10 text-danger">
            <ExclamationTriangleIcon className="size-7" aria-hidden="true" />
          </div>

          <div className="flex flex-col gap-2">
            <h2 id="delete-room-title" className="text-xl font-bold text-ink">
              Excluir turma?
            </h2>
            <p className="text-base font-semibold text-brand-900">{roomName}</p>
            <div className="mt-2 rounded-xl bg-danger/10 p-3 text-center">
              <p className="text-sm font-medium text-danger leading-relaxed">
                Atenção: esta ação excluirá permanentemente a turma e todos os{' '}
                <strong>dados de alunos, notas, problemas e avaliações</strong> vinculados a ela.
              </p>
            </div>
          </div>

          <ModalActions isLoading={isLoading} onConfirm={onConfirm} onCancel={onCancel} />
        </div>
      </div>
    </div>
  );
}
