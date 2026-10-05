import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ChevronLeftIcon,
  DocumentTextIcon,
  MagnifyingGlassIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { roomService } from '@/services/room.service';
import { problemService } from '@/services/problem.service';
import { sessionService } from '@/services/session.service';
import type { Room } from '@/types/room';
import type { Problem } from '@/types/problem';
import type { Session } from '@/types/session';
import { cn } from '@/utils/cn';
import { SessionsEmptyState } from './SessionsEmptyState';
import { SessionFormModal } from './SessionFormModal';
import { SessionCard } from './SessionCard';

function getInitials(name?: string) {
  if (!name) return 'U';
  return name
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');
}

function parseRoomTurma(fullName?: string) {
  if (!fullName) return '';
  const parts = fullName.split(' - ');
  return parts.length > 1 ? parts.pop() : '';
}

function ProblemSessionsHeader({
  room,
  problem,
  userNome,
}: {
  room: Room | null;
  problem: Problem | null;
  userNome?: string;
}) {
  const turma = parseRoomTurma(room?.nome);

  return (
    <header className="flex h-16 shrink-0 items-center justify-between bg-brand-900 px-4 text-white">
      <div className="flex items-center gap-3">
        <Link
          to={`/turmas/${room?.id}/problemas`}
          aria-label="Voltar para os problemas"
          className="rounded-md p-1 hover:bg-white/10"
        >
          <ChevronLeftIcon className="size-6" />
        </Link>
        <div className="flex flex-col">
          <h1 className="text-base font-semibold leading-tight">{problem?.titulo || 'Problema'}</h1>
          {turma && <span className="text-xs text-white/70">{turma}</span>}
        </div>
      </div>
      <div className="flex size-9 items-center justify-center rounded-full bg-brand-200 text-sm font-semibold text-brand-900">
        {getInitials(userNome)}
      </div>
    </header>
  );
}

function ProblemTopActions({ isProfessor }: { isProfessor: boolean }) {
  if (!isProfessor) return null;

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={() => {}}
        className="flex items-center gap-4 rounded-2xl border border-black/5 bg-white p-4 shadow-sm transition hover:shadow-md text-left"
      >
        <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-900">
          <DocumentTextIcon className="size-6" />
        </div>
        <div>
          <h3 className="text-base font-bold text-ink">Relatório Final</h3>
          <p className="text-xs text-muted">Nota final do problema</p>
        </div>
      </button>
    </div>
  );
}

function SessionsSearch({ query, setQuery }: { query: string; setQuery: (v: string) => void }) {
  return (
    <div className="relative mt-2">
      <input
        type="text"
        placeholder="Pesquisar sessão"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="h-12 w-full rounded-[10px] border border-black/10 bg-white pl-10 pr-4 text-ink placeholder:text-placeholder focus:border-brand-900 focus:outline-none"
      />
      <MagnifyingGlassIcon className="pointer-events-none absolute left-3.5 top-3.5 size-5 text-placeholder" />
    </div>
  );
}

function SessionsFabMenu({
  isProfessor,
  onOpenCreate,
}: {
  isProfessor: boolean;
  onOpenCreate: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  if (!isProfessor) return null;

  return (
    <div className="fixed bottom-6 right-6 flex flex-col items-end gap-3">
      {isOpen && (
        <div className="flex animate-fade-up flex-col items-end gap-2">
          <button className="rounded-full border border-brand-900 bg-white px-5 py-2 text-sm font-semibold text-brand-900 shadow-sm hover:bg-brand-50">
            Editar uma sessão
          </button>
          <button
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
    <main className="mx-auto mt-6 flex w-full max-w-md flex-col gap-4 px-4">
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
        <div className="mt-2 flex flex-col gap-3">
          {sessions.map((session) => (
            <SessionCard key={session.id} session={session} roomId={roomId} problemId={problemId} />
          ))}
        </div>
      )}
    </main>
  );
}

// Hook extraído para aliviar a função da página
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
  const { roomId, problemId } = useParams<{ roomId: string; problemId: string }>();
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const isProfessor = user?.tipo === 'PROFESSOR';
  const { room, problem, sessions, isLoading, error, handleSessionCreated } = useProblemSessions(
    roomId,
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
        roomId={roomId ?? ''}
        problemId={problemId ?? ''}
      />
      <SessionsFabMenu isProfessor={isProfessor} onOpenCreate={() => setIsCreateModalOpen(true)} />
      <SessionFormModal
        isOpen={isCreateModalOpen}
        roomId={roomId ?? ''}
        problemId={problemId ?? ''}
        initialData={null}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleSessionCreated}
      />
    </div>
  );
}
