import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { UserGroupIcon } from '@heroicons/react/24/outline';
import { PAGE_CONTAINER_CLASS } from '@/components/ui/cardStyles';
import { useAuth } from '@/hooks/useAuth';
import { RoomProblemsHeader } from '@/pages/problems/RoomProblemsHeader';
import { ROUTES } from '@/routes/paths';
import { memberRoomService } from '@/services/memberRoom.service';
import { cn } from '@/utils/cn';

// GET /salas/:id/alunos and /professores are tutor-only, so students get a notice instead.
export function StudentMembersNotice({ roomId }: { roomId: string }) {
  const { user } = useAuth();
  const [roomName, setRoomName] = useState<string | null>(null);
  const roomPath = `${ROUTES.rooms}/${roomId}/problemas`;

  useEffect(() => {
    memberRoomService
      .room(roomId, false)
      .then((room) => setRoomName(room.nome))
      .catch(() => setRoomName(null));
  }, [roomId]);

  return (
    <div className="min-h-dvh bg-surface pb-12">
      <RoomProblemsHeader
        room={roomName ? { nome: roomName } : null}
        user={user}
        backTo={roomPath}
        backLabel="Voltar para a turma"
      />
      <main className={cn(PAGE_CONTAINER_CLASS, 'mt-16 flex flex-col items-center text-center')}>
        <span className="flex size-16 items-center justify-center rounded-full bg-brand-100 text-brand-900">
          <UserGroupIcon className="size-8" aria-hidden />
        </span>
        <h2 className="mt-4 text-base font-semibold text-ink">
          A lista de participantes ainda não está disponível para alunos.
        </h2>
        <p className="mt-1 text-sm text-muted">Por enquanto, apenas os professores podem vê-la.</p>
        <Link
          to={roomPath}
          className="mt-8 rounded-xl border border-brand-900 bg-white px-5 py-3 font-semibold text-brand-900 transition-[background-color,scale] duration-200 hover:bg-brand-50 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-brand-900"
        >
          Voltar para a turma
        </Link>
      </main>
    </div>
  );
}
