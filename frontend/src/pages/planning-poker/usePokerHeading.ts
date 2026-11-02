import { useEffect, useState } from 'react';
import { memberRoomService } from '@/services/memberRoom.service';
import { problemService } from '@/services/problem.service';
import { sessionService } from '@/services/session.service';
import { formatDayShortMonth } from '@/utils/date';

type PokerHeadingParams = {
  roomId: string;
  problemId: string;
  sessionId: string;
  isProfessor: boolean;
};

type Heading = { session: string; problem: string };

async function loadHeading(params: PokerHeadingParams): Promise<Heading> {
  if (!params.isProfessor) {
    const session = await memberRoomService.studentSession(params.sessionId);
    return {
      session: `${session.titulo} · ${formatDayShortMonth(session.data)}`,
      problem: session.problemaTitulo,
    };
  }
  const [session, problem] = await Promise.all([
    sessionService.getById(params.roomId, params.problemId, params.sessionId),
    problemService.getById(params.roomId, params.problemId),
  ]);
  return {
    session: `${session.titulo} · ${formatDayShortMonth(session.data)}`,
    problem: problem.titulo,
  };
}

export function usePokerHeading(params: PokerHeadingParams) {
  const [heading, setHeading] = useState<Heading | null>(null);
  const { roomId, problemId, sessionId, isProfessor } = params;

  useEffect(() => {
    let active = true;
    loadHeading({ roomId, problemId, sessionId, isProfessor })
      .then((loaded) => active && setHeading(loaded))
      .catch(() => active && setHeading(null));
    return () => {
      active = false;
    };
  }, [roomId, problemId, sessionId, isProfessor]);

  return {
    sessionLabel: heading?.session ?? 'Sessão',
    subtitle: heading ? `${heading.session} · ${heading.problem}` : 'Sessão',
  };
}
