import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { AppHeader } from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/Button';
import { SearchField } from '@/components/ui/SearchField';
import { CARD_CLASS, CARD_GRID_CLASS, PAGE_CONTAINER_CLASS } from '@/components/ui/cardStyles';
import { cn } from '@/utils/cn';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { roomService } from '@/services/room.service';
import { ROUTES } from '@/routes/paths';
import type { Room } from '@/types/room';
import { countLabel } from '@/utils/countLabel';
import { DeleteRoomModal } from './DeleteRoomModal';
import { Link } from 'react-router-dom';
import { useRoomDeletion } from './hooks/useRoomDeletion';

function ManageRoomCard({
  room,
  onDeleteRequest,
}: {
  room: Room;
  onDeleteRequest: (room: Room) => void;
}) {
  return (
    <div className={CARD_CLASS}>
      <div className="h-1 w-full bg-brand-900" />
      <div className="flex flex-col gap-3 p-4">
        <h3 className="line-clamp-2 text-base font-bold text-brand-900">{room.nome}</h3>
        <div className="mt-1 flex items-center justify-between">
          <span className="text-sm text-muted">
            {countLabel(room.totalAlunos ?? 0, 'aluno', 'alunos')}
          </span>
          <div className="flex items-center gap-3">
            <Link
              to={ROUTES.editRoom.replace(':id', room.id)}
              aria-label={`Editar ${room.nome}`}
              className="p-1 text-ink/70 hover:text-brand-900 focus-visible:outline-2 focus-visible:outline-brand-900"
            >
              <PencilIcon className="size-5" />
            </Link>
            <button
              type="button"
              onClick={() => onDeleteRequest(room)}
              aria-label={`Excluir ${room.nome}`}
              className="p-1 text-danger hover:text-danger/80 focus-visible:outline-2 focus-visible:outline-danger"
            >
              <TrashIcon className="size-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ManageRoomsFooter({ onFinish }: { onFinish: () => void }) {
  return (
    <footer className="fixed bottom-0 left-0 right-0 border-t border-black/5 bg-surface/95 px-6 py-4 backdrop-blur-xs">
      <div className="mx-auto flex max-w-md flex-col gap-2">
        <Button onClick={onFinish}>Concluir edição</Button>
        <Button variant="link" onClick={onFinish}>
          Cancelar
        </Button>
      </div>
    </footer>
  );
}

type ManageRoomsContentProps = {
  isLoading: boolean;
  rooms: Room[];
  error: { message: string } | null;
  onDeleteRequest: (room: Room) => void;
};

function ManageRoomsContent({ isLoading, rooms, error, onDeleteRequest }: ManageRoomsContentProps) {
  if (isLoading) {
    return (
      <div className="mt-10 flex justify-center">
        <Spinner className="size-8 text-brand-900" />
      </div>
    );
  }

  return (
    <main className={cn(PAGE_CONTAINER_CLASS, 'mt-6')}>
      <h2 className="text-xs font-bold uppercase tracking-widest text-muted">
        Minhas turmas · {rooms.length}
      </h2>
      {error && (
        <Alert tone="error" className="mt-4">
          {error.message}
        </Alert>
      )}
      <div className={cn(CARD_GRID_CLASS, 'mt-4')}>
        {rooms.map((room) => (
          <ManageRoomCard key={room.id} room={room} onDeleteRequest={onDeleteRequest} />
        ))}
      </div>
    </main>
  );
}

export default function ManageRoomsPage() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [query, setQuery] = useState('');

  const { run: fetchRooms, isLoading, error } = useAsyncAction(roomService.list);
  const {
    roomToDelete,
    isOwner,
    isDeleting,
    errorMessage,
    onOpenDelete,
    onCancelDelete,
    onConfirmDelete,
  } = useRoomDeletion(setRooms);

  useEffect(() => {
    fetchRooms().then((res) => {
      if (res.ok) setRooms(res.data);
    });
  }, [fetchRooms]);

  const filteredRooms = rooms.filter((r) => r.nome.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="min-h-dvh bg-surface pb-36">
      <AppHeader />
      <div className={cn(PAGE_CONTAINER_CLASS, 'mt-4')}>
        <SearchField label="Pesquisar turma" value={query} onChange={setQuery} />
      </div>
      <ManageRoomsContent
        isLoading={isLoading}
        rooms={filteredRooms}
        error={error}
        onDeleteRequest={onOpenDelete}
      />
      <ManageRoomsFooter onFinish={() => navigate(ROUTES.rooms)} />
      <DeleteRoomModal
        roomName={roomToDelete?.nome ?? ''}
        isOpen={Boolean(roomToDelete)}
        isLoading={isDeleting}
        isOwner={isOwner}
        errorMessage={errorMessage}
        onConfirm={onConfirmDelete}
        onCancel={onCancelDelete}
      />
    </div>
  );
}
