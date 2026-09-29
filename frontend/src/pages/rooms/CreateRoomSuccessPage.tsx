import { useState } from 'react';
import { useLocation, Navigate, useNavigate } from 'react-router-dom';
import { DocumentDuplicateIcon, CheckIcon } from '@heroicons/react/24/outline';
import { FlowShell } from '@/components/layout/FlowShell';
import { Button } from '@/components/ui/Button';
import { SuccessState } from '@/components/ui/SuccessState';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { ROUTES } from '@/routes/paths';
import { buildRoomInviteUrl } from '@/utils/urlBuilder';

function CopyRow({
  label,
  value,
  displayValue,
}: {
  label: string;
  value: string;
  displayValue?: string;
}) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex items-center justify-between gap-2 text-sm text-brand-900">
      <p className="truncate">
        <span className="font-semibold">{label}:</span>{' '}
        <span className="[font-feature-settings:'calt'_0]">{displayValue ?? value}</span>
      </p>
      <button
        onClick={handleCopy}
        aria-label={`Copiar ${label}`}
        className="shrink-0 rounded-md p-1 transition-[color,transform] duration-200 hover:text-brand-700 active:scale-90 focus-visible:outline-2 focus-visible:outline-brand-900"
      >
        {copied ? (
          <CheckIcon
            key="copied"
            className="size-5 text-success animate-pop-in"
            strokeWidth={2.5}
          />
        ) : (
          <DocumentDuplicateIcon key="copy" className="size-5 animate-pop-in" />
        )}
      </button>
    </div>
  );
}

function SuccessInfoCard({ roomCode }: { roomCode: string }) {
  const inviteUrl = buildRoomInviteUrl(roomCode);
  const displayUrl = inviteUrl.replace(/^https?:\/\//, '');

  return (
    <div className="mt-8 flex flex-col gap-4 rounded-[10px] bg-black/5 p-5 text-left">
      <CopyRow label="Código" value={roomCode} />
      <CopyRow label="Link" value={inviteUrl} displayValue={displayUrl} />
    </div>
  );
}

function SuccessActions({ roomId, inviteUrl }: { roomId: string; inviteUrl: string }) {
  const navigate = useNavigate();
  const { notify } = useToast();

  async function handleShare() {
    if (navigator.share) {
      await navigator.share({ title: 'Convite para turma', url: inviteUrl });
    } else {
      await navigator.clipboard.writeText(inviteUrl);
      notify({ tone: 'success', message: 'Link da turma copiado.' });
    }
  }

  return (
    <div className="mt-8 flex w-full flex-col gap-4">
      <Button onClick={() => navigate(`${ROUTES.rooms}/${roomId}`)}>Ir para a turma</Button>
      <Button variant="outline" onClick={handleShare}>
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
            <SuccessActions roomId={room.id} inviteUrl={buildRoomInviteUrl(roomCode)} />
          </>
        }
      />
    </FlowShell>
  );
}
