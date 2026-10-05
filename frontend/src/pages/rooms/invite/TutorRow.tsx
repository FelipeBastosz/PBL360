import { useState } from 'react';
import { TrashIcon } from '@heroicons/react/24/outline';
import { Spinner } from '@/components/ui/Spinner';
import { UserAvatar } from '@/components/ui/UserAvatar';
import type { RoomTutor } from '@/types/room';

type TutorRowProps = {
  tutor: RoomTutor;
  canRemove: boolean;
  isPending: boolean;
  onRemove: (tutor: RoomTutor) => void;
};

function RemoveControl({ tutor, isPending, onRemove }: Omit<TutorRowProps, 'canRemove'>) {
  const [isConfirming, setIsConfirming] = useState(false);

  if (isPending) return <Spinner className="size-5 text-brand-900" />;

  if (!isConfirming) {
    return (
      <button
        type="button"
        onClick={() => setIsConfirming(true)}
        aria-label={`Remover ${tutor.nome}`}
        className="rounded-full p-2 text-danger transition-[background-color,scale] duration-200 hover:bg-danger-soft active:scale-90 focus-visible:outline-2 focus-visible:outline-danger"
      >
        <TrashIcon className="size-5" aria-hidden />
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1 animate-fade-in">
      <button
        type="button"
        onClick={() => setIsConfirming(false)}
        className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-muted hover:bg-black/5"
      >
        Cancelar
      </button>
      <button
        type="button"
        onClick={() => onRemove(tutor)}
        className="rounded-lg bg-danger px-2.5 py-1.5 text-sm font-semibold text-white transition-[scale] active:scale-95"
      >
        Remover
      </button>
    </div>
  );
}

export function TutorRow({ tutor, canRemove, isPending, onRemove }: TutorRowProps) {
  return (
    <li className="flex items-center gap-3 py-3">
      <UserAvatar user={{ id: tutor.id, nome: tutor.nome, possuiFoto: true }} className="size-10" />
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 truncate font-semibold text-ink">
          <span className="truncate">{tutor.nome}</span>
          {tutor.responsavel && (
            <span className="shrink-0 rounded-full bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-900">
              Responsável
            </span>
          )}
        </p>
        <p className="truncate text-sm text-muted">{tutor.email}</p>
      </div>
      {canRemove && !tutor.responsavel && (
        <RemoveControl tutor={tutor} isPending={isPending} onRemove={onRemove} />
      )}
    </li>
  );
}
