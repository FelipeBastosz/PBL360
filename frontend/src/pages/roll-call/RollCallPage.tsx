import { useLocation, useParams } from 'react-router-dom';
import { Alert } from '@/components/ui/Alert';
import { Spinner } from '@/components/ui/Spinner';
import { useLeaveGuard } from '@/hooks/useLeaveGuard';
import { useRollCall } from '@/hooks/useRollCall';
import { useRollCallTitle } from '@/hooks/useRollCallTitle';
import { ROUTES } from '@/routes/paths';
import { LeaveDialog } from './LeaveDialog';
import { RollCallHeader } from './RollCallHeader';
import { RollCallScreen } from './RollCallScreen';

type RollCallLocationState = { titulo?: string; subtitulo?: string } | null;

type RollCallParams = {
  sessaoId?: string;
  sessionId?: string;
  roomId?: string;
  problemId?: string;
};

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
