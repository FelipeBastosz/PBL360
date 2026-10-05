import { ShareIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { CopyValue } from '@/components/ui/CopyValue';
import { useShareInvite } from '@/hooks/useShareInvite';
import { buildRoomInviteUrl } from '@/utils/urlBuilder';

type StudentInviteTabProps = {
  roomName: string;
  roomCode: string;
};

export function StudentInviteTab({ roomName, roomCode }: StudentInviteTabProps) {
  const shareInvite = useShareInvite();
  const inviteUrl = buildRoomInviteUrl(roomCode);

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm text-muted">
        Os alunos entram na turma com o código ou pelo link de convite.
      </p>
      <div className="flex flex-col items-center gap-1 rounded-2xl bg-brand-50 px-4 py-5 text-center">
        <span className="text-sm text-brand-300">Código da turma</span>
        <span className="font-mono text-3xl font-bold tracking-[0.18em] text-brand-900">
          {roomCode}
        </span>
      </div>
      <div className="flex flex-col gap-3 rounded-2xl border border-black/5 p-4">
        <CopyValue label="Código" value={roomCode} isCode />
        <CopyValue
          label="Link"
          value={inviteUrl}
          displayValue={inviteUrl.replace(/^https?:\/\//, '')}
        />
      </div>
      <Button onClick={() => shareInvite({ roomName, roomCode })}>
        <ShareIcon className="size-5" aria-hidden />
        Compartilhar convite
      </Button>
    </div>
  );
}
