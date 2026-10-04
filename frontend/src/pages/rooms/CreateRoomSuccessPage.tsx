import { useLocation, Navigate, useNavigate } from 'react-router-dom';
import { FlowShell } from '@/components/layout/FlowShell';
import { Button } from '@/components/ui/Button';
import { CopyValue } from '@/components/ui/CopyValue';
import { SuccessState } from '@/components/ui/SuccessState';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { useAuth } from '@/hooks/useAuth';
import { useShareInvite } from '@/hooks/useShareInvite';
import { ROUTES } from '@/routes/paths';
import { buildRoomInviteUrl } from '@/utils/urlBuilder';

function SuccessInfoCard({ roomCode }: { roomCode: string }) {
  const inviteUrl = buildRoomInviteUrl(roomCode);
  const displayUrl = inviteUrl.replace(/^https?:\/\//, '');

  return (
    <div className="mt-8 flex flex-col gap-4 rounded-[10px] bg-black/5 p-5 text-left">
      <CopyValue label="Código" value={roomCode} />
      <CopyValue label="Link" value={inviteUrl} displayValue={displayUrl} />
    </div>
  );
}

type SuccessActionsProps = { roomId: string; roomName: string; roomCode: string };

function SuccessActions({ roomId, roomName, roomCode }: SuccessActionsProps) {
  const navigate = useNavigate();
  const shareInvite = useShareInvite();

  return (
    <div className="mt-8 flex w-full flex-col gap-4">
      <Button onClick={() => navigate(`/turmas/${roomId}/problemas`)}>Ir para a turma</Button>
      <Button variant="outline" onClick={() => shareInvite({ roomName, roomCode })}>
        Compartilhar link
      </Button>
    </div>
  );
}

export default function CreateRoomSuccessPage() {
  const location = useLocation();
  const { user } = useAuth();
  const room = location.state?.room;

  if (!room) {
    return <Navigate to={ROUTES.rooms} replace />;
  }

  const roomCode = room.roomCode || room.codigoSala;
  const roomName = room.nome || room.name;

  return (
    <FlowShell title="Turma criada" backTo={ROUTES.rooms} trailing={<UserAvatar user={user} />}>
      <SuccessState
        title="Turma criada com sucesso!"
        description={`Você criou a turma: ${roomName}`}
        action={
          <>
            <SuccessInfoCard roomCode={roomCode} />
            <SuccessActions roomId={room.id} roomName={roomName} roomCode={roomCode} />
          </>
        }
      />
    </FlowShell>
  );
}
