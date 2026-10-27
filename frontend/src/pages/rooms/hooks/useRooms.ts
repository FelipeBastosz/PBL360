import { useState, useEffect, useCallback } from 'react';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { roomService } from '@/services/room.service';
import { problemService } from '@/services/problem.service';
import type { Room, StudentRoom } from '@/types/room';

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

export function useRooms(isStudent: boolean) {
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

  return { rooms, setRooms, isLoading, error, reload };
}
