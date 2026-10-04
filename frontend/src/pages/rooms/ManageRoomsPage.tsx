import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MagnifyingGlassIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { HorizontalLogo } from '@/components/ui/HorizontalLogo';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { useAuth } from '@/hooks/useAuth';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { roomService } from '@/services/room.service';
import { ROUTES } from '@/routes/paths';
import type { Room } from '@/types/room';
import { countLabel } from '@/utils/countLabel';
import { DeleteRoomModal } from './DeleteRoomModal';
import { Link } from 'react-router-dom';

function getInitials(name?: string) {
  if (!name) return 'U';
  return name
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');
}

function ManageRoomsHeader() {
  const { user } = useAuth();
  return (
    <header className="flex h-16 shrink-0 items-center justify-between bg-brand-900 px-4">
      <HorizontalLogo />
      <div className="flex size-9 items-center justify-center rounded-full bg-brand-200 text-sm font-semibold text-brand-900">
        {getInitials(user?.nome)}
      </div>
    </header>
  );
}

function ManageRoomsSearch({ query, setQuery }: { query: string; setQuery: (v: string) => void }) {
  return (
    <div className="relative mt-4 px-4">
      <input
        type="text"
        placeholder="Pesquisar turma"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="h-12 w-full rounded-[10px] border border-black/10 bg-white pl-10 pr-4 text-ink placeholder:text-placeholder focus:border-brand-900 focus:outline-none"
      />
      <MagnifyingGlassIcon className="pointer-events-none absolute left-7 top-3.5 size-5 text-placeholder" />
    </div>
  );
}

function ManageRoomCard({
  room,
  onDeleteRequest,
}: {
  room: Room;
  onDeleteRequest: (room: Room) => void;
}) {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-black/5 bg-white shadow-sm">
      <div className="h-1.5 w-full bg-brand-900" />
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
    <main className="mx-auto mt-6 w-full max-w-md px-4">
      <h2 className="text-xs font-bold uppercase tracking-widest text-muted">
        Minhas turmas · {rooms.length}
      </h2>
      {error && (
        <Alert tone="error" className="mt-4">
          {error.message}
        </Alert>
      )}
      <div className="mt-4 flex flex-col gap-4">
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
  const [roomToDelete, setRoomToDelete] = useState<Room | null>(null);

  const { run: fetchRooms, isLoading, error } = useAsyncAction(roomService.list);
  const { run: deleteRoom, isLoading: isDeleting } = useAsyncAction(roomService.remove);

  useEffect(() => {
    fetchRooms().then((res) => {
      if (res.ok) setRooms(res.data);
    });
  }, [fetchRooms]);

  async function handleConfirmDelete() {
    if (!roomToDelete) return;
    const res = await deleteRoom(roomToDelete.id);
    if (res.ok) {
      setRooms((current) => current.filter((r) => r.id !== roomToDelete.id));
      setRoomToDelete(null);
    }
  }

  const filteredRooms = rooms.filter((r) => r.nome.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="min-h-dvh bg-surface pb-36">
      <ManageRoomsHeader />
      <ManageRoomsSearch query={query} setQuery={setQuery} />
      <ManageRoomsContent
        isLoading={isLoading}
        rooms={filteredRooms}
        error={error}
        onDeleteRequest={setRoomToDelete}
      />
      <ManageRoomsFooter onFinish={() => navigate(ROUTES.rooms)} />
      <DeleteRoomModal
        roomName={roomToDelete?.nome ?? ''}
        isOpen={Boolean(roomToDelete)}
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setRoomToDelete(null)}
      />
    </div>
  );
}
