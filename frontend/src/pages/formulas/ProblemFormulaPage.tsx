import { useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/routes/paths';
import type { FormulaScope } from '@/types/formula';
import { FormulaEditor } from './FormulaEditor';
import { SCOPE_TABS } from '@/utils/formula';
import { FormulaHeader } from './FormulaHeader';
import { useProblemCriteria } from './useProblemCriteria';

type FormulaParams = { roomId: string; problemId: string; sessionId: string };

const sessionPath = ({ roomId, problemId, sessionId }: FormulaParams) =>
  ROUTES.sessionHub
    .replace(':roomId', roomId)
    .replace(':problemId', problemId)
    .replace(':sessionId', sessionId);

function TutorFormulaPage({
  roomId,
  problemId,
  backTo,
}: {
  roomId: string;
  problemId: string;
  backTo: string;
}) {
  const { user } = useAuth();
  const [scope, setScope] = useState<FormulaScope>('SESSAO');
  const criteria = useProblemCriteria(roomId, problemId);

  return (
    <div className="flex min-h-dvh flex-col bg-surface">
      <FormulaHeader user={user} backTo={backTo} scope={scope} onScopeChange={setScope} />
      {SCOPE_TABS.map((tab) => (
        <FormulaEditor
          key={tab.scope}
          roomId={roomId}
          problemId={problemId}
          scope={tab.scope}
          criteria={criteria}
          hidden={tab.scope !== scope}
        />
      ))}
    </div>
  );
}

// Formulas are tutor-only in the API; students go back to the session.
export default function ProblemFormulaPage() {
  const { roomId = '', problemId = '', sessionId = '' } = useParams<FormulaParams>();
  const { user } = useAuth();
  const backTo = sessionPath({ roomId, problemId, sessionId });

  if (user?.tipo !== 'PROFESSOR') return <Navigate to={backTo} replace />;
  return <TutorFormulaPage roomId={roomId} problemId={problemId} backTo={backTo} />;
}
