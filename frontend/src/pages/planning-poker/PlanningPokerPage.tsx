import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Spinner } from '@/components/ui/Spinner';
import { useAuth } from '@/hooks/useAuth';
import { usePlanningPoker } from '@/hooks/usePlanningPoker';
import { ConnectionErrorState } from './PokerEmptyState';
import { PokerHeader } from './PokerHeader';
import { StudentPokerScreen } from './StudentPokerScreen';
import { TutorPokerScreen } from './TutorPokerScreen';
import { usePokerActions } from './usePokerActions';
import { usePokerHeading } from './usePokerHeading';

type PokerParams = { roomId: string; problemId: string; sessionId: string };

export default function PlanningPokerPage() {
  const { roomId = '', problemId = '', sessionId = '' } = useParams<PokerParams>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isProfessor = user?.tipo === 'PROFESSOR';
  const poker = usePlanningPoker(sessionId);
  const actions = usePokerActions(sessionId, poker.refresh);
  const heading = usePokerHeading({ roomId, problemId, sessionId, isProfessor });
  const hubPath = `/turmas/${roomId}/problemas/${problemId}/sessoes/${sessionId}`;
  const goBack = () => navigate(hubPath);

  function renderBody() {
    if (poker.isClosed) return <Navigate to={hubPath} replace />;
    if (poker.loadError || poker.connection === 'error') {
      return <ConnectionErrorState onRetry={() => void poker.refresh()} onBack={goBack} />;
    }
    if (!poker.state) {
      return (
        <div className="mt-16 flex justify-center">
          <Spinner className="size-8 text-brand-900" />
        </div>
      );
    }
    if (isProfessor) {
      return (
        <TutorPokerScreen
          state={poker.state}
          connection={poker.connection}
          sessionLabel={heading.sessionLabel}
          actions={actions}
          onClosed={goBack}
        />
      );
    }
    return (
      <StudentPokerScreen
        state={poker.state}
        connection={poker.connection}
        actions={actions}
        onBack={goBack}
      />
    );
  }

  return (
    <div className="flex h-dvh flex-col bg-surface">
      <PokerHeader title="Planning poker" subtitle={heading.subtitle} onBack={goBack} />
      {renderBody()}
    </div>
  );
}
