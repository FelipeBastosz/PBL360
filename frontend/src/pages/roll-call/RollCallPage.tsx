import { useLocation, useParams } from 'react-router-dom';
import { Alert } from '@/components/ui/Alert';
import { Spinner } from '@/components/ui/Spinner';
import { useLeaveGuard } from '@/hooks/useLeaveGuard';
import { useRollCall } from '@/hooks/useRollCall';
import { ROUTES } from '@/routes/paths';
import { LeaveDialog } from './LeaveDialog';
import { RollCallHeader } from './RollCallHeader';
import { RollCallScreen } from './RollCallScreen';

type RollCallLocationState = { titulo?: string; subtitulo?: string } | null;

export default function RollCallPage() {
  const { sessaoId = '' } = useParams<{ sessaoId: string }>();
  const state = useLocation().state as RollCallLocationState;
  const rollCall = useRollCall(sessaoId);
  const guard = useLeaveGuard(rollCall.isDirty, ROUTES.rooms);

  return (
    <div className="min-h-dvh bg-surface">
      <RollCallHeader
        title={state?.titulo ?? 'Chamada'}
        subtitle={state?.subtitulo ?? 'Sessão'}
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
          sessionId={sessaoId}
          rollCall={rollCall.rollCall}
          board={rollCall.board}
        />
      )}
      <LeaveDialog isOpen={guard.isAsking} onStay={guard.stay} onLeave={guard.confirmLeave} />
    </div>
  );
}
