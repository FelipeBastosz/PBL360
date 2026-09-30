import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { MagnifyingGlassIcon, PlusIcon } from '@heroicons/react/24/outline';
import { HorizontalLogo } from '@/components/ui/HorizontalLogo';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { useAuth } from '@/hooks/useAuth';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { roomService } from '@/services/room.service';
import { ROUTES } from '@/routes/paths';
import type { Room, StudentRoom } from '@/types/room';
import { cn } from '@/utils/cn';

function RoomsHeader() {
  const { user } = useAuth();

  return (
    <header className="flex h-16 shrink-0 items-center justify-between bg-brand-900 px-4">
      <HorizontalLogo />
      <UserAvatar user={user} />
    </header>
  );
}

type RoomsSearchProps = { query: string; setQuery: (q: string) => void };
function RoomsSearch({ query, setQuery }: RoomsSearchProps) {
  return (
    <div className="relative mt-4 px-4">
      <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center pl-3">
        <MagnifyingGlassIcon className="size-5 text-placeholder" aria-hidden />
      </div>
      <input
        type="text"
        placeholder="Pesquisar turma"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="h-12 w-full rounded-[10px] border border-black/10 bg-white pl-10 pr-4 text-ink placeholder:text-placeholder focus:border-brand-900 focus:outline-none focus:ring-1 focus:ring-brand-900"
      />
    </div>
  );
}

function toRoom(studentRoom: StudentRoom): Room {
  return {
    id: studentRoom.salaId,
    nome: studentRoom.nome,
    semestre: studentRoom.semestre,
    codigoDisciplina: '',
    codigoSala: '',
    professorResponsavelId: '',
    ativo: true,
    criadoEm: '',
  };
}

function RoomsEmptyState({ isStudent }: { isStudent: boolean }) {
  return (
    <div className="mt-20 flex flex-col items-center justify-center px-6 text-center">
      <p className="text-base font-semibold text-ink">
        {isStudent
          ? 'Você ainda não faz parte de nenhuma turma.'
          : 'Você ainda não possui turmas cadastradas.'}
      </p>
      <p className="mt-1 text-sm text-muted">
        Toque no <span className="font-bold text-brand-900">+</span> para começar.
      </p>
    </div>
  );
}

function RoomsFabMenu({ isStudent }: { isStudent: boolean }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 flex flex-col items-end gap-3">
      {isOpen && (
        <div className="flex animate-fade-up flex-col items-end gap-2">
          {isStudent ? (
            <button className="rounded-full border border-brand-900 bg-white px-5 py-2 text-sm font-semibold text-brand-900 shadow-sm hover:bg-brand-50">
              Entrar em uma turma
            </button>
          ) : (
            <>
              <Link
                to={ROUTES.manageRooms}
                className="rounded-full border border-brand-900 bg-white px-5 py-2 text-sm font-semibold text-brand-900 shadow-sm hover:bg-brand-50"
              >
                Editar uma turma
              </Link>
              <Link
                to={ROUTES.createRoom}
                className="rounded-full border border-brand-900 bg-white px-5 py-2 text-sm font-semibold text-brand-900 shadow-sm hover:bg-brand-50"
              >
                Criar nova turma
              </Link>
            </>
          )}
        </div>
      )}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex size-14 items-center justify-center rounded-full bg-brand-900 text-white shadow-lg transition-transform',
          isOpen ? 'rotate-45 bg-danger' : '',
        )}
        aria-label="Ações de turma"
      >
        <PlusIcon className="size-6" strokeWidth={2.5} />
      </button>
    </div>
  );
}

type RoomCardProps = { room: Room; professorNome?: string };
function RoomCard({ room, professorNome }: RoomCardProps) {
  return (
    <Link
      to={`${ROUTES.rooms}/${room.id}`}
      className="flex flex-col overflow-hidden rounded-xl border border-black/5 bg-white shadow-sm transition-shadow hover:shadow-md focus-visible:outline-2 focus-visible:outline-brand-900"
    >
      <div className="h-1.5 w-full bg-brand-900" />
      <div className="flex flex-col gap-3 p-4">
        <div>
          <h3 className="line-clamp-2 text-base font-bold text-brand-900">{room.nome}</h3>
          <p className="text-sm text-muted">Prof. {professorNome || 'Responsável'}</p>
        </div>
        <div className="mt-1 flex items-center justify-between">
          <span className="text-sm text-muted">0 alunos</span>
          <span className="rounded-full bg-brand-200 px-2.5 py-0.5 text-xs font-bold text-brand-900">
            0 problemas
          </span>
        </div>
      </div>
    </Link>
  );
}

type RoomsListProps = {
  isLoading: boolean;
  rooms: Room[];
  isStudent: boolean;
  hasFilter: boolean;
  userNome?: string;
};

function RoomsList({ isLoading, rooms, isStudent, hasFilter, userNome }: RoomsListProps) {
  if (isLoading) {
    return (
      <div className="mt-10 flex justify-center">
        <Spinner className="size-8 text-brand-900" />
      </div>
    );
  }

  if (rooms.length === 0) {
    return hasFilter ? (
      <p className="mt-10 text-center text-sm text-muted">Nenhuma turma encontrada.</p>
    ) : (
      <RoomsEmptyState isStudent={isStudent} />
    );
  }

  return (
    <div className="mt-4 flex flex-col gap-4">
      {rooms.map((room) => (
        <RoomCard key={room.id} room={room} professorNome={isStudent ? undefined : userNome} />
      ))}
    </div>
  );
}

export default function RoomsPage() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [query, setQuery] = useState('');
  const isStudent = user?.tipo === 'ALUNO';

  const fetchRooms = useCallback(async (): Promise<Room[]> => {
    if (isStudent) {
      const studentRooms = roomService.listMyRooms ? await roomService.listMyRooms() : [];
      return studentRooms.map(toRoom);
    }
    return roomService.list();
  }, [isStudent]);

  const { run, isLoading, error } = useAsyncAction(fetchRooms);

  useEffect(() => {
    run().then((result) => {
      if (result.ok) setRooms(result.data);
    });
  }, [run]);

  const filteredRooms = rooms.filter((r) => r.nome.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="min-h-dvh bg-surface pb-24">
      <RoomsHeader />
      <RoomsSearch query={query} setQuery={setQuery} />

      <main className="mx-auto mt-6 w-full max-w-md px-4">
        <h2 className="text-xs font-bold uppercase tracking-widest text-muted">
          Minhas turmas · {filteredRooms.length}
        </h2>
        {error && (
          <Alert tone="error" className="mt-4">
            {error.message}
          </Alert>
        )}
        <RoomsList
          isLoading={isLoading}
          rooms={filteredRooms}
          isStudent={isStudent}
          hasFilter={query.length > 0}
          userNome={user?.nome}
        />
      </main>

      <RoomsFabMenu isStudent={isStudent} />
    </div>
  );
}
