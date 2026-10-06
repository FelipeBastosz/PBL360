import { useEffect, useState } from 'react';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { memberRoomService } from '@/services/memberRoom.service';
import { roomService } from '@/services/room.service';
import type { RoomStudent, RoomTutor } from '@/types/room';

export type RoomMembers = {
  roomName: string;
  students: RoomStudent[];
  tutors: RoomTutor[];
};

async function fetchRoomMembers(roomId: string, isProfessor: boolean): Promise<RoomMembers> {
  const [room, students, tutors] = await Promise.all([
    memberRoomService.room(roomId, isProfessor),
    roomService.listStudents(roomId),
    roomService.listTutors(roomId),
  ]);
  return { roomName: room.nome, students, tutors };
}

export function useRoomMembers(roomId: string, isProfessor: boolean) {
  const [members, setMembers] = useState<RoomMembers | null>(null);
  const { run, error } = useAsyncAction(fetchRoomMembers);

  useEffect(() => {
    run(roomId, isProfessor).then((result) => result.ok && setMembers(result.data));
  }, [run, roomId, isProfessor]);

  return { members, error };
}
