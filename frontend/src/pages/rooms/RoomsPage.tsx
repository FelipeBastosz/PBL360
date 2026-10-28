import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { AppHeader } from '@/components/layout/AppHeader';
import { FabMenu, type FabAction } from '@/components/ui/FabMenu';
import { SearchField } from '@/components/ui/SearchField';
import {
  CARD_ACCENT_CLASS,
  CARD_GRID_CLASS,
  INTERACTIVE_CARD_CLASS,
  PAGE_CONTAINER_CLASS,
} from '@/components/ui/cardStyles';
import { cn } from '@/utils/cn';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { useAuth } from '@/hooks/useAuth';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { roomService } from '@/services/room.service';
import { problemService } from '@/services/problem.service';
import { ROUTES } from '@/routes/paths';
import type { Room, StudentRoom } from '@/types/room';
import { countLabel } from '@/utils/countLabel';
import { JoinRoomSheet } from './JoinRoomSheet';

function toRoom(studentRoom: StudentRoom): Room {
  return {
    id: studentRoom.salaId,
    nome: studentRoom.nome,
    semestre: studentRoom.semestre,
    codigoDisciplina: '',
    codigoSala: '',
    professorResponsavelId: studentRoom.professorResponsavel?.id ?? '',
    professorResponsavel: studentRoom.professorResponsavel,
    ativo: true,
    criadoEm: '',
    totalAlunos: studentRoom.totalAlunos,
    totalProblemas: studentRoom.totalProblemas,
  };
}

// GET /salas does not return the counts yet, so they are fetched per room when missing.
async function withCounts(room: Room): Promise<Room> {
  if (room.totalAlunos !== undefined && room.totalProblemas !== undefined) return room;

  const [students, problems] = await Promise.allSettled([
    roomService.listStudents(room.id),
    problemService.list(room.id),
  ]);

  return {
    ...room,
    totalAlunos: students.status === 'fulfilled' ? students.value.length : room.totalAlunos,
    totalProblemas: problems.status === 'fulfilled' ? problems.value.length : room.totalProblemas,
  };
}

const TUTOR_ACTIONS: FabAction[] = [
  { label: 'Editar uma turma', to: ROUTES.manageRooms },
  { label: 'Criar nova turma', to: ROUTES.createRoom },
];

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
  const displayProf = room.professorResponsavel?.nome ?? professorNome;

  return (
    <Link to={`${ROUTES.rooms}/${room.id}/problemas`} className={INTERACTIVE_CARD_CLASS}>
      <div className={CARD_ACCENT_CLASS} />
      <div className="flex flex-col gap-3 p-4">
        <div>
          <h3 className="line-clamp-2 text-base font-bold text-brand-900">{room.nome}</h3>
          {displayProf && <p className="text-sm text-muted">Prof. {displayProf}</p>}
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
    <div className={cn(CARD_GRID_CLASS, 'mt-4')}>
      {rooms.map((room) => (
        <RoomCard
          key={room.id}
          room={room}
          professorNome={room.professorResponsavel?.nome ?? (isStudent ? undefined : userNome)}
        />
      ))}
    </div>
  );
}

function useRooms(isStudent: boolean) {
  const [rooms, setRooms] = useState<Room[]>([]);

  const fetchRooms = useCallback(async (): Promise<Room[]> => {
    if (isStudent) {
      const studentRooms = roomService.listMyRooms ? await roomService.listMyRooms() : [];
      return studentRooms.map(toRoom);
    }
    const tutorRooms = await roomService.list();
    return Promise.all(tutorRooms.map(withCounts));
  }, [isStudent]);

  const { run, isLoading, error } = useAsyncAction(fetchRooms);

  const reload = useCallback(() => {
    run().then((result) => {
      if (result.ok) setRooms(result.data);
    });
  }, [run]);

  useEffect(() => reload(), [reload]);

  return { rooms, isLoading, error, reload };
}

export default function RoomsPage() {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const isStudent = user?.tipo === 'ALUNO';
  const { rooms, isLoading, error, reload } = useRooms(isStudent);
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const studentActions: FabAction[] = [
    { label: 'Entrar em uma turma', onClick: () => setIsJoinOpen(true) },
  ];

  function handleJoined() {
    setIsJoinOpen(false);
    reload();
  }

  const filteredRooms = rooms.filter((r) => r.nome.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="min-h-dvh bg-surface pb-24">
      <AppHeader />
      <div className={cn(PAGE_CONTAINER_CLASS, 'mt-4')}>
        <SearchField label="Pesquisar turma" value={query} onChange={setQuery} />
      </div>

      <main className={cn(PAGE_CONTAINER_CLASS, 'mt-6')}>
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

      <FabMenu label="Ações de turma" actions={isStudent ? studentActions : TUTOR_ACTIONS} />
      {isStudent && (
        <JoinRoomSheet
          isOpen={isJoinOpen}
          onClose={() => setIsJoinOpen(false)}
          onJoined={handleJoined}
        />
      )}
    </div>
  );
}
