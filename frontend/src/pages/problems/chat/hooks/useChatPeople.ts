import { useCallback, useEffect, useState } from 'react';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { roomService } from '@/services/room.service';
import type { ChatPerson } from '@/utils/chat';

// A tutor talks to the students of the room; a student, to its tutors.
async function fetchChatPeople(roomId: string, isProfessor: boolean): Promise<ChatPerson[]> {
  if (isProfessor) {
    const students = await roomService.listStudents(roomId);
    return students.map(({ id, nome, matricula }) => ({
      id,
      nome,
      descricao: matricula ? `Matrícula ${matricula}` : 'Aluno',
    }));
  }
  const tutors = await roomService.listTutors(roomId);
  return tutors.map(({ id, nome, responsavel }) => ({
    id,
    nome,
    descricao: responsavel ? 'Professor responsável' : 'Professor colaborador',
  }));
}

export function useChatPeople(roomId: string, isProfessor: boolean) {
  const [people, setPeople] = useState<ChatPerson[] | null>(null);
  const { run, error } = useAsyncAction(fetchChatPeople);

  const load = useCallback(() => {
    run(roomId, isProfessor).then((result) => result.ok && setPeople(result.data));
  }, [run, roomId, isProfessor]);

  useEffect(() => load(), [load]);

  return { people, error, retry: load };
}
