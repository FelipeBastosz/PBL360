import { useEffect, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { AppHeader } from '@/components/layout/AppHeader';
import { PAGE_CONTAINER_CLASS } from '@/components/ui/cardStyles';
import { problemService } from '@/services/problem.service';
import { roomService } from '@/services/room.service';
import type { Problem } from '@/types/problem';
import type { Room } from '@/types/room';
import { cn } from '@/utils/cn';

type SessionReportParams = {
  roomId?: string;
  turmaId?: string;
  problemId?: string;
  problemaId?: string;
  sessionId?: string;
  sessaoId?: string;
};

function parseRoomTurma(fullName?: string) {
  if (!fullName) return '';
  const parts = fullName.split(' - ');
  return parts.length > 1 ? parts.pop()! : fullName;
}

export function SessionReportPage() {
  const params = useParams<SessionReportParams>();
  const roomId = params.roomId ?? params.turmaId ?? '';
  const problemId = params.problemId ?? params.problemaId ?? '';
  const sessionId = params.sessionId ?? params.sessaoId ?? '';

  const location = useLocation();
  const state = location.state as {
    problemTitle?: string;
    roomTurma?: string;
  } | null;

  const [problem, setProblem] = useState<Pick<Problem, 'titulo'> | null>(
    state?.problemTitle ? { titulo: state.problemTitle } : null,
  );
  const [room, setRoom] = useState<Pick<Room, 'nome'> | null>(
    state?.roomTurma ? { nome: state.roomTurma } : null,
  );

  useEffect(() => {
    if (!roomId || !problemId) return undefined;
    let active = true;

    Promise.all([
      problemService.getById(roomId, problemId).catch(() => null),
      roomService.getById(roomId).catch(() => null),
    ]).then(([problemData, roomData]) => {
      if (!active) return;
      if (problemData) setProblem(problemData);
      if (roomData) setRoom(roomData);
    });

    return () => {
      active = false;
    };
  }, [roomId, problemId]);

  const backUrl = `/turmas/${roomId}/problemas/${problemId}/sessoes/${sessionId}`;
  const turma = parseRoomTurma(room?.nome);

  return (
    <div className="min-h-dvh bg-surface pb-12">
      <AppHeader
        backUrl={backUrl}
        title={problem?.titulo || 'Problema'}
        subtitle={turma || undefined}
      />
      <main className={cn(PAGE_CONTAINER_CLASS, 'mt-6')} />
    </div>
  );
}

export default SessionReportPage;
