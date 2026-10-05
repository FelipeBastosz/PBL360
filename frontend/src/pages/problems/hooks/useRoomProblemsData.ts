import { useCallback, useEffect, useState } from 'react';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { ApiError } from '@/services/apiError';
import { problemService } from '@/services/problem.service';
import { roomService } from '@/services/room.service';
import type { Problem } from '@/types/problem';

export const NOT_A_MEMBER_MESSAGE = 'Você não faz parte desta turma.';

// GET /salas/:id is tutor-only; a student's rooms come from GET /salas/minhas.
async function fetchRoomName(roomId: string, isProfessor: boolean): Promise<string> {
  if (isProfessor) return (await roomService.getById(roomId)).nome;
  const room = (await roomService.listMyRooms()).find((r) => r.salaId === roomId);
  if (!room) throw new ApiError(404, [NOT_A_MEMBER_MESSAGE]);
  return room.nome;
}

// The API lists a room's problems only to its tutors; there is no student endpoint yet.
async function fetchProblems(roomId: string, isProfessor: boolean): Promise<Problem[]> {
  return isProfessor ? problemService.list(roomId) : [];
}

export function useRoomProblemsData(roomId: string | undefined, isProfessor: boolean) {
  const [roomName, setRoomName] = useState<string>();
  const [problems, setProblems] = useState<Problem[]>([]);
  const { run: loadRoom, error: roomError } = useAsyncAction(fetchRoomName);
  const { run: loadProblems, isLoading } = useAsyncAction(fetchProblems);

  useEffect(() => {
    if (!roomId) return;
    loadRoom(roomId, isProfessor).then((res) => res.ok && setRoomName(res.data));
    loadProblems(roomId, isProfessor).then((res) => res.ok && setProblems(res.data));
  }, [roomId, isProfessor, loadRoom, loadProblems]);

  const addProblem = useCallback((problem: Problem) => {
    setProblems((current) => [...current, problem]);
  }, []);

  return { roomName, problems, addProblem, roomError, isLoading };
}
