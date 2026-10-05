import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDaysIcon } from '@heroicons/react/24/outline';
import { Alert } from '@/components/ui/Alert';
import { Spinner } from '@/components/ui/Spinner';
import {
  CARD_GRID_CLASS,
  INTERACTIVE_CARD_CLASS,
  PAGE_CONTAINER_CLASS,
} from '@/components/ui/cardStyles';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { useAuth } from '@/hooks/useAuth';
import { roomService } from '@/services/room.service';
import { sessionService } from '@/services/session.service';
import type { RoomSession } from '@/types/session';
import { cn } from '@/utils/cn';
import { formatDayShortMonth } from '@/utils/formatDate';
import { RoomProblemsHeader } from './RoomProblemsHeader';

type ProblemGroup = { problemId: string; title: string; sessions: RoomSession[] };

function groupByProblem(sessions: RoomSession[]): ProblemGroup[] {
  const groups = new Map<string, ProblemGroup>();
  sessions.forEach((session) => {
    const group = groups.get(session.problemaId) ?? {
      problemId: session.problemaId,
      title: session.problemaTitulo,
      sessions: [],
    };
    group.sessions.push(session);
    groups.set(session.problemaId, group);
  });
  return [...groups.values()];
}

function SessionLink({ session }: { session: RoomSession }) {
  return (
    <Link
      to={`/sessoes/${session.id}`}
      className={cn(INTERACTIVE_CARD_CLASS, 'flex-row items-center gap-4 p-4')}
    >
      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-900">
        <CalendarDaysIcon className="size-6" aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="block truncate font-semibold text-ink">{session.titulo}</span>
        <span className="block text-sm text-muted">{formatDayShortMonth(session.data)}</span>
      </span>
    </Link>
  );
}

function SessionGroups({ sessions }: { sessions: RoomSession[] }) {
  if (!sessions.length) {
    return (
      <p className="mt-10 text-center text-sm text-muted">Nenhuma sessão nesta turma ainda.</p>
    );
  }
  return groupByProblem(sessions).map((group) => (
    <section key={group.problemId} aria-label={group.title} className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-muted">{group.title}</h2>
      <div className={CARD_GRID_CLASS}>
        {group.sessions.map((session) => (
          <SessionLink key={session.id} session={session} />
        ))}
      </div>
    </section>
  ));
}

export function StudentRoomSessions({ roomId }: { roomId: string }) {
  const { user } = useAuth();
  const [roomName, setRoomName] = useState<string | null>(null);
  const [sessions, setSessions] = useState<RoomSession[]>([]);
  const { run, isLoading, error } = useAsyncAction(sessionService.listForRoom);

  useEffect(() => {
    run(roomId).then((result) => result.ok && setSessions(result.data));
    roomService
      .listMyRooms()
      .then((rooms) => setRoomName(rooms.find((room) => room.salaId === roomId)?.nome ?? null))
      .catch(() => setRoomName(null));
  }, [roomId, run]);

  return (
    <div className="min-h-dvh bg-surface pb-12">
      <RoomProblemsHeader room={roomName ? { nome: roomName } : null} user={user} />
      <main className={cn(PAGE_CONTAINER_CLASS, 'mt-6 flex flex-col gap-6')}>
        {error && <Alert tone="error">{error.message}</Alert>}
        {isLoading ? (
          <Spinner className="mx-auto mt-10 size-8 text-brand-900" />
        ) : (
          !error && <SessionGroups sessions={sessions} />
        )}
      </main>
    </div>
  );
}
