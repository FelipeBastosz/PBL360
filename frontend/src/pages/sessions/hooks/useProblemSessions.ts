import { useEffect, useState } from 'react';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { useToast } from '@/hooks/useToast';
import {
  memberRoomService,
  type ProblemHeading,
  type RoomHeading,
} from '@/services/memberRoom.service';
import type { Session } from '@/types/session';

export function useProblemSessions(
  isProfessor: boolean,
  roomId?: string,
  problemId?: string,
  onCreatedSuccess?: () => void,
) {
  const { notify } = useToast();
  const [room, setRoom] = useState<RoomHeading | null>(null);
  const [problem, setProblem] = useState<ProblemHeading | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);

  const { run: fetchRoom } = useAsyncAction(memberRoomService.room);
  const { run: fetchProblem } = useAsyncAction(memberRoomService.problem);
  const { run: fetchSessions, isLoading, error } = useAsyncAction(memberRoomService.sessions);

  useEffect(() => {
    if (roomId && problemId) {
      fetchRoom(roomId, isProfessor).then((res) => res.ok && setRoom(res.data));
      fetchProblem(roomId, problemId, isProfessor).then((res) => res.ok && setProblem(res.data));
      fetchSessions(roomId, problemId, isProfessor).then((res) => res.ok && setSessions(res.data));
    }
  }, [isProfessor, roomId, problemId, fetchRoom, fetchProblem, fetchSessions]);

  function handleSessionCreated(newSession: Session) {
    setSessions((curr) => [...curr, newSession]);
    onCreatedSuccess?.();
    notify({ tone: 'success', message: 'Sessão criada com sucesso!' });
  }

  return { room, problem, sessions, isLoading, error, handleSessionCreated };
}
