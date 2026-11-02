import { XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';

export type LeaveRoomModalProps = {
  roomName: string;
  isOpen: boolean;
  isLoading: boolean;
  isOwner?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

type ConfirmActionsProps = {
  isLoading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

function ConfirmActions({ isLoading, onConfirm, onCancel }: ConfirmActionsProps) {
  return (
    <div className="mt-2 flex w-full flex-col gap-2">
      <Button
        type="button"
        isLoading={isLoading}
        onClick={onConfirm}
        className="border-transparent bg-danger text-white hover:bg-danger/90 focus-visible:outline-danger"
      >
        Sim, sair da turma
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

function OwnerBlockedBody({ roomName, onClose }: { roomName: string; onClose: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-amber-100 text-amber-700">
        <ExclamationTriangleIcon className="size-7" aria-hidden="true" />
      </div>

      <div className="flex flex-col gap-2">
        <h2 id="leave-room-title" className="text-xl font-bold text-ink">
          Não é possível sair da turma
        </h2>
        <p className="text-base font-semibold text-brand-900">{roomName}</p>
        <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-center">
          <p className="text-sm font-semibold leading-relaxed text-amber-900">
            O professor responsável não pode sair da turma. Transfira a responsabilidade ou exclua a
            sala.
          </p>
        </div>
        <p className="text-xs leading-relaxed text-muted">
          Como titular desta turma, você é o responsável pela sala. Para sair, transfira a
          titularidade ou exclua a turma.
        </p>
      </div>

      <div className="mt-2 flex w-full flex-col gap-2">
        <Button
          type="button"
          onClick={onClose}
          className="w-full bg-brand-900 text-white hover:bg-brand-900/90"
        >
          Entendi
        </Button>
      </div>
    </div>
  );
}

function StandardConfirmBody({
  roomName,
  isLoading,
  onConfirm,
  onCancel,
}: {
  roomName: string;
  isLoading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-danger/10 text-danger">
        <ExclamationTriangleIcon className="size-7" aria-hidden="true" />
      </div>

      <div className="flex flex-col gap-2">
        <h2 id="leave-room-title" className="text-xl font-bold text-ink">
          Sair da turma?
        </h2>
        <p className="text-base font-semibold text-brand-900">{roomName}</p>
        <div className="mt-2 rounded-xl bg-danger/10 p-3 text-center">
          <p className="text-sm font-medium leading-relaxed text-danger">
            Atenção: ao sair da turma, você perderá o acesso às{' '}
            <strong>atividades, problemas e materiais</strong> vinculados a ela.
          </p>
        </div>
      </div>

      <ConfirmActions isLoading={isLoading} onConfirm={onConfirm} onCancel={onCancel} />
    </div>
  );
}

export function LeaveRoomModal({
  roomName,
  isOpen,
  isLoading,
  isOwner = false,
  onConfirm,
  onCancel,
}: LeaveRoomModalProps) {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="leave-room-title"
      className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
    >
      <div
        className={`animate-pop-in relative w-full max-w-sm rounded-[24px] border-2 bg-white p-6 shadow-2xl ${
          isOwner ? 'border-amber-500' : 'border-danger'
        }`}
      >
        <button
          type="button"
          onClick={isLoading ? undefined : onCancel}
          disabled={isLoading}
          aria-label="Fechar confirmação"
          className="absolute right-4 top-4 rounded-full p-1 text-ink/60 hover:bg-black/5 hover:text-ink focus-visible:outline-2 focus-visible:outline-brand-900"
        >
          <XMarkIcon className="size-6" />
        </button>

        {isOwner ? (
          <OwnerBlockedBody roomName={roomName} onClose={onCancel} />
        ) : (
          <StandardConfirmBody
            roomName={roomName}
            isLoading={isLoading}
            onConfirm={onConfirm}
            onCancel={onCancel}
          />
        )}
      </div>
    </div>
  );
}
