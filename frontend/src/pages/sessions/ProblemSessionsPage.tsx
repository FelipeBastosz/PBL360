import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { PlusIcon } from '@heroicons/react/24/outline';
import { SearchField } from '@/components/ui/SearchField';
import { CARD_GRID_CLASS, PAGE_CONTAINER_CLASS } from '@/components/ui/cardStyles';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { roomService } from '@/services/room.service';
import { problemService } from '@/services/problem.service';
import { sessionService } from '@/services/session.service';
import { ROUTES } from '@/routes/paths';
import type { Room } from '@/types/room';
import type { Problem } from '@/types/problem';
import type { Session } from '@/types/session';
import { cn } from '@/utils/cn';
import { SessionsEmptyState } from './SessionsEmptyState';
import { SessionFormModal } from './SessionFormModal';
import { SessionCard } from './SessionCard';
import { ProblemSessionsHeader } from './ProblemSessionsHeader';
import { ProblemTopActions } from './ProblemTopActions';

function SessionsSearch({ query, setQuery }: { query: string; setQuery: (v: string) => void }) {
  return (
    <SearchField label="Pesquisar sessão" value={query} onChange={setQuery} className="mt-2" />
  );
}

type FabMenuProps = {
  isProfessor: boolean;
  roomId: string;
  problemId: string;
  onOpenCreate: () => void;
};

function SessionsFabMenu({ isProfessor, roomId, problemId, onOpenCreate }: FabMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  if (!isProfessor) return null;

  return (
    <div className="fixed bottom-6 right-6 flex flex-col items-end gap-3">
      {isOpen && (
        <div className="flex animate-fade-up flex-col items-end gap-2">
          <a
            href={ROUTES.manageSessions.replace(':roomId', roomId).replace(':problemId', problemId)}
            className="rounded-full border border-brand-900 bg-white px-5 py-2 text-sm font-semibold text-brand-900 shadow-sm hover:bg-brand-50"
          >
            Editar uma sessão
          </a>
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onOpenCreate();
            }}
            className="rounded-full border border-brand-900 bg-white px-5 py-2 text-sm font-semibold text-brand-900 shadow-sm hover:bg-brand-50"
          >
            Criar nova sessão
          </button>
        </div>
      )}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex size-14 items-center justify-center rounded-full bg-brand-900 text-white shadow-lg transition-transform',
          isOpen ? 'rotate-45 bg-danger' : '',
        )}
        aria-label="Ações da sessão"
      >
        <PlusIcon className="size-6" strokeWidth={2.5} />
      </button>
    </div>
  );
}

type MainProps = {
  error: { message: string } | null;
  isProfessor: boolean;
  query: string;
  setQuery: (v: string) => void;
  isLoading: boolean;
  sessions: Session[];
  roomId: string;
  problemId: string;
};

function ProblemSessionsMain({
  error,
  isProfessor,
  query,
  setQuery,
  isLoading,
  sessions,
  roomId,
  problemId,
}: MainProps) {
  return (
    <main className={cn(PAGE_CONTAINER_CLASS, 'mt-6 flex flex-col gap-4')}>
      {error && <Alert tone="error">{error.message}</Alert>}
      <ProblemTopActions isProfessor={isProfessor} />
      <SessionsSearch query={query} setQuery={setQuery} />
      {isLoading ? (
        <div className="mt-10 flex justify-center">
          <Spinner className="size-8 text-brand-900" />
        </div>
      ) : sessions.length === 0 ? (
        query ? (
          <p className="mt-10 text-center text-sm text-muted">Nenhuma sessão encontrada.</p>
        ) : (
          <SessionsEmptyState isProfessor={isProfessor} />
        )
      ) : (
        <div className={cn(CARD_GRID_CLASS, 'mt-2')}>
          {sessions.map((session) => (
            <SessionCard key={session.id} session={session} roomId={roomId} problemId={problemId} />
          ))}
        </div>
      )}
    </main>
  );
}

function useProblemSessions(roomId?: string, problemId?: string, onCreatedSuccess?: () => void) {
  const { notify } = useToast();
  const [room, setRoom] = useState<Room | null>(null);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);

  const { run: fetchRoom } = useAsyncAction(roomService.getById);
  const { run: fetchProblem } = useAsyncAction(problemService.getById);
  const { run: fetchSessions, isLoading, error } = useAsyncAction(sessionService.list);

  useEffect(() => {
    if (roomId && problemId) {
      fetchRoom(roomId).then((res) => res.ok && setRoom(res.data));
      fetchProblem(roomId, problemId).then((res) => res.ok && setProblem(res.data));
      fetchSessions(roomId, problemId).then((res) => res.ok && setSessions(res.data as Session[]));
    }
  }, [roomId, problemId, fetchRoom, fetchProblem, fetchSessions]);

  function handleSessionCreated(newSession: Session) {
    setSessions((curr) => [...curr, newSession]);
    onCreatedSuccess?.();
    notify({ tone: 'success', message: 'Sessão criada com sucesso!' });
  }

  return { room, problem, sessions, isLoading, error, handleSessionCreated };
}

export default function ProblemSessionsPage() {
  const params = useParams<{ roomId?: string; id?: string; problemId: string }>();
  const currentRoomId = params.roomId || params.id || '';
  const problemId = params.problemId || '';

  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const isProfessor = user?.tipo === 'PROFESSOR';
  const { room, problem, sessions, isLoading, error, handleSessionCreated } = useProblemSessions(
    currentRoomId,
    problemId,
    () => setIsCreateModalOpen(false),
  );

  const filtered = sessions.filter((s) => s.titulo.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="min-h-dvh bg-surface pb-24">
      <ProblemSessionsHeader room={room} problem={problem} userNome={user?.nome} />
      <ProblemSessionsMain
        error={error}
        isProfessor={isProfessor}
        query={query}
        setQuery={setQuery}
        isLoading={isLoading}
        sessions={filtered}
        roomId={currentRoomId}
        problemId={problemId}
      />
      <SessionsFabMenu
        isProfessor={isProfessor}
        roomId={currentRoomId}
        problemId={problemId}
        onOpenCreate={() => setIsCreateModalOpen(true)}
      />
      <SessionFormModal
        isOpen={isCreateModalOpen}
        roomId={currentRoomId}
        problemId={problemId}
        initialData={null}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleSessionCreated}
      />
    </div>
  );
}
