import { useLocation, useParams } from 'react-router-dom';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';
import { UserMenuButton } from '@/components/layout/UserMenu';
import { Alert } from '@/components/ui/Alert';
import { Spinner } from '@/components/ui/Spinner';
import { PAGE_CONTAINER_CLASS } from '@/components/ui/cardStyles';
import { useLeaveGuard } from '@/hooks/useLeaveGuard';
import { useAuth } from '@/hooks/useAuth';
import { useRollCall } from '@/hooks/useRollCall';
import { useRollCallTitle } from '@/hooks/useRollCallTitle';
import { ROUTES } from '@/routes/paths';
import { cn } from '@/utils/cn';
import { LeaveDialog } from './LeaveDialog';
import { RollCallScreen } from './RollCallScreen';

type RollCallLocationState = { titulo?: string; subtitulo?: string } | null;

type RollCallParams = {
  sessaoId?: string;
  sessionId?: string;
  roomId?: string;
  problemId?: string;
};

function RollCallHeader({
  title,
  subtitle,
  onBack,
}: {
  title: string;
  subtitle: string;
  onBack: () => void;
}) {
  const { user } = useAuth();
  return (
    <header className="shrink-0 bg-brand-900 text-white">
      <div className={cn(PAGE_CONTAINER_CLASS, 'flex h-16 items-center justify-between gap-3')}>
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            aria-label="Voltar"
            className="-ml-1 shrink-0 rounded-full p-2 transition-[background-color,scale] duration-200 hover:bg-white/10 active:scale-90 focus-visible:outline-2 focus-visible:outline-white"
          >
            <ChevronLeftIcon className="size-6" />
          </button>
          <div className="flex min-w-0 flex-col">
            <h1 className="truncate text-base font-semibold leading-tight">{title}</h1>
            <span className="truncate text-xs text-white/70">{subtitle}</span>
          </div>
        </div>
        <UserMenuButton user={user} className="ring-2 ring-white/20" />
      </div>
    </header>
  );
}

export default function RollCallPage() {
  const { sessaoId, sessionId, roomId, problemId } = useParams<RollCallParams>();
  const id = sessaoId ?? sessionId ?? '';
  const state = useLocation().state as RollCallLocationState;
  const heading = useRollCallTitle({
    roomId,
    problemId,
    sessionId: id,
    fallback: { title: state?.titulo ?? 'Chamada', subtitle: state?.subtitulo ?? 'Sessão' },
  });
  const rollCall = useRollCall(id);
  const backPath =
    roomId && problemId ? `/turmas/${roomId}/problemas/${problemId}/sessoes/${id}` : ROUTES.rooms;
  const guard = useLeaveGuard(rollCall.isDirty, backPath);

  return (
    <div className="min-h-dvh bg-surface">
      <RollCallHeader
        title={heading.title}
        subtitle={heading.subtitle}
        onBack={guard.requestLeave}
      />
      {rollCall.error && (
        <div className="mx-auto mt-6 max-w-md px-4 animate-shake">
          <Alert tone="error">{rollCall.error.message}</Alert>
        </div>
      )}
      {rollCall.isLoading && !rollCall.board && (
        <div className="mt-16 flex justify-center">
          <Spinner className="size-8 text-brand-900" />
        </div>
      )}
      {rollCall.rollCall && rollCall.board && (
        <RollCallScreen
          {...rollCall}
          sessionId={id}
          rollCall={rollCall.rollCall}
          board={rollCall.board}
        />
      )}
      <LeaveDialog isOpen={guard.isAsking} onStay={guard.stay} onLeave={guard.confirmLeave} />
    </div>
  );
}
