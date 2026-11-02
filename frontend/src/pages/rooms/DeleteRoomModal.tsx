import { XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { useEscapeKey } from '@/hooks/useEscapeKey';

type DeleteRoomModalProps = {
  roomName: string;
  isOpen: boolean;
  isLoading: boolean;
  isOwner?: boolean;
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

function RoomModalActions({
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

function RoomModalContent({
  roomName,
  isOwner,
  errorMessage,
}: {
  roomName: string;
  isOwner: boolean;
  errorMessage?: string | null;
}) {
  const isBlocked = !isOwner || Boolean(errorMessage);
  const title = isBlocked ? 'Não é possível excluir a turma' : 'Excluir turma?';

  return (
    <div className="flex flex-col gap-2">
      <h2 id="delete-room-title" className="text-xl font-bold text-ink">
        {title}
      </h2>
      <p className="text-base font-semibold text-brand-900">{roomName}</p>
      {!isOwner ? (
        <div role="alert" className="mt-2 rounded-xl bg-danger/10 p-3 text-center">
          <p className="text-sm font-medium text-danger leading-relaxed">
            Você não possui permissão para excluir esta turma. Apenas o professor responsável pode
            realizar a exclusão.
          </p>
        </div>
      ) : errorMessage ? (
        <div role="alert" className="mt-2 rounded-xl bg-danger/10 p-3 text-center">
          <p className="text-sm font-medium text-danger leading-relaxed">{errorMessage}</p>
        </div>
      ) : (
        <div className="mt-2 rounded-xl bg-danger/10 p-3 text-center">
          <p className="text-sm font-medium text-danger leading-relaxed">
            Atenção: esta ação excluirá permanentemente a turma e todos os{' '}
            <strong>dados de alunos, notas, problemas e avaliações</strong> vinculados a ela.
          </p>
        </div>
      )}
    </div>
  );
}

export function DeleteRoomModal({
  roomName,
  isOpen,
  isLoading,
  isOwner = true,
  errorMessage,
  onConfirm,
  onCancel,
}: DeleteRoomModalProps) {
  useEscapeKey(isOpen, onCancel, isLoading);
  if (!isOpen) return null;

  const isBlocked = !isOwner || Boolean(errorMessage);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-room-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fade-in"
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
          <DeleteIcon />
          <RoomModalContent roomName={roomName} isOwner={isOwner} errorMessage={errorMessage} />
          <RoomModalActions
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
