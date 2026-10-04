import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { HorizontalLogo } from '@/components/ui/HorizontalLogo';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { FabMenu, type FabAction } from '@/components/ui/FabMenu';
import { SearchField } from '@/components/ui/SearchField';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { useAuth } from '@/hooks/useAuth';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { roomService } from '@/services/room.service';
import { ROUTES } from '@/routes/paths';
import type { Room, StudentRoom } from '@/types/room';
import { countLabel } from '@/utils/countLabel';

function RoomsHeader() {
  const { user } = useAuth();

  return (
    <header className="flex h-16 shrink-0 items-center justify-between bg-brand-900 px-4">
      <HorizontalLogo />
      <UserAvatar user={user} />
    </header>
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
    totalAlunos: studentRoom.totalAlunos,
    totalProblemas: studentRoom.totalProblemas,
  };
}

const TUTOR_ACTIONS: FabAction[] = [
  { label: 'Editar uma turma', to: ROUTES.manageRooms },
  { label: 'Criar nova turma', to: ROUTES.createRoom },
];

const STUDENT_ACTIONS: FabAction[] = [{ label: 'Entrar em uma turma' }];

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

type RoomCardProps = { room: Room; professorNome?: string };
function RoomCard({ room, professorNome }: RoomCardProps) {
  return (
    <Link
      to={`${ROUTES.rooms}/${room.id}/problemas`}
      className="flex flex-col overflow-hidden rounded-xl border border-black/5 bg-white shadow-sm transition-shadow hover:shadow-md focus-visible:outline-2 focus-visible:outline-brand-900"
    >
      <div className="h-1.5 w-full bg-brand-900" />
      <div className="flex flex-col gap-3 p-4">
        <div>
          <h3 className="line-clamp-2 text-base font-bold text-brand-900">{room.nome}</h3>
          {professorNome && <p className="text-sm text-muted">Prof. {professorNome}</p>}
        </div>
        <div className="mt-1 flex items-center justify-between">
          <span className="text-sm text-muted">
            {countLabel(room.totalAlunos ?? 0, 'aluno', 'alunos')}
          </span>
          <span className="rounded-full bg-brand-200 px-2.5 py-0.5 text-xs font-bold text-brand-900">
            {countLabel(room.totalProblemas ?? 0, 'problema', 'problemas')}
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
      <SearchField
        label="Pesquisar turma"
        value={query}
        onChange={setQuery}
        className="mx-4 mt-4"
      />

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

      <FabMenu label="Ações de turma" actions={isStudent ? STUDENT_ACTIONS : TUTOR_ACTIONS} />
    </div>
  );
}
