import { useState } from 'react';
import { useLocation, Navigate, useNavigate, Link } from 'react-router-dom';
import { ChevronLeftIcon, DocumentDuplicateIcon, CheckIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { SuccessState } from '@/components/ui/SuccessState';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/routes/paths';
import { buildRoomInviteUrl } from '@/utils/urlBuilder';

function getInitials(name?: string) {
  if (!name) return 'U';
  return name
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');
}

function SuccessHeader() {
  const { user } = useAuth();
  return (
    <header className="flex h-16 shrink-0 items-center justify-between bg-brand-900 px-4">
      <div className="flex items-center gap-2 text-white">
        <Link to={ROUTES.rooms} aria-label="Voltar" className="rounded-md p-1 hover:bg-white/10">
          <ChevronLeftIcon className="size-6" aria-hidden />
        </Link>
        <h1 className="text-lg font-semibold">Turma criada</h1>
      </div>
      <div className="flex size-9 items-center justify-center rounded-full bg-brand-200 text-sm font-semibold text-brand-900">
        {getInitials(user?.nome)}
      </div>
    </header>
  );
}

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
        <span className="font-semibold">{label}:</span> {displayValue ?? value}
      </p>
      <button
        onClick={handleCopy}
        aria-label={`Copiar ${label}`}
        className="shrink-0 p-1 hover:text-brand-700"
      >
        {copied ? (
          <CheckIcon className="size-5 text-success" />
        ) : (
          <DocumentDuplicateIcon className="size-5" />
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

  async function handleShare() {
    if (navigator.share) {
      await navigator.share({ title: 'Convite para turma', url: inviteUrl });
    } else {
      navigator.clipboard.writeText(inviteUrl);
      alert('Link copiado para a área de transferência!');
    }
  }

  return (
    <div className="mt-8 flex w-full flex-col gap-4">
      <Button onClick={() => navigate(`${ROUTES.rooms}/${roomId}`)}>Ir para a turma</Button>
      <Button
        className="bg-brand-200 text-brand-900 hover:bg-brand-300 focus-visible:outline-brand-900"
        onClick={handleShare}
      >
        Compartilhar link
      </Button>
    </div>
  );
}

export default function CreateRoomSuccessPage() {
  const location = useLocation();
  const room = location.state?.room;

  if (!room) {
    return <Navigate to={ROUTES.rooms} replace />;
  }

  const roomCode = room.roomCode || room.codigoSala;
  const roomName = room.nome || room.name;

  return (
    <div className="min-h-dvh bg-surface">
      <SuccessHeader />
      <main className="mx-auto flex w-full max-w-md flex-col px-6 pt-12 text-center">
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
      </main>
    </div>
  );
}
