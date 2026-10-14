import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import type { SessionReleasesResponse } from '@/types/session';
import { SessionActionGrid } from './SessionActionGrid';
import { SessionEvaluationsCard } from './SessionEvaluationsCard';
import { SessionAttachments } from './SessionAttachments';
import { PlanningPokerHubCard } from './PlanningPokerHubCard';
import { StudentEvaluationCenter } from './StudentEvaluationCenter';
import { StudentPokerNotice } from './StudentPokerNotice';

type SessionHubContentProps = {
  isLoading: boolean;
  isProfessor: boolean;
  basePath: string;
  sessionId: string;
  releases: SessionReleasesResponse | null;
  onToggle: (type: 'autoavaliacao' | 'pares') => void;
  isAttendancePending: boolean;
  isUpdating: boolean;
};

function StudentHubContent({ sessionId, pokerPath }: { sessionId: string; pokerPath: string }) {
  return (
    <>
      <StudentEvaluationCenter>
        <StudentPokerNotice sessionId={sessionId} pokerPath={pokerPath} />
      </StudentEvaluationCenter>
      <SessionAttachments sessionId={sessionId} canUpload />
    </>
  );
}

export function SessionHubContent({
  isLoading,
  isProfessor,
  basePath,
  sessionId,
  releases,
  onToggle,
  isAttendancePending,
  isUpdating,
}: SessionHubContentProps) {
  if (isLoading) {
    return (
      <div className="mt-10 flex justify-center">
        <Spinner className="size-8 text-brand-900" />
      </div>
    );
  }

  const isStudentEvalActive = Boolean(releases?.autoavaliacao.liberada || releases?.pares.liberada);
  const pokerPath = `${basePath}/planning-poker`;

  if (!isProfessor) return <StudentHubContent sessionId={sessionId} pokerPath={pokerPath} />;

  return (
    <>
      <SessionActionGrid basePath={basePath} isStudentEvalActive={isStudentEvalActive}>
        <PlanningPokerHubCard sessionId={sessionId} pokerPath={pokerPath} refreshKey={releases} />
      </SessionActionGrid>
      <SessionEvaluationsCard
        releases={releases}
        onToggle={onToggle}
        isAttendancePending={isAttendancePending}
        isLoading={isUpdating}
      />
      <SessionAttachments sessionId={sessionId} canUpload />
      <div className="mt-4 flex flex-col gap-2">
        <Button
          type="button"
          variant="outline"
          disabled
          className="border-danger/30 text-danger cursor-not-allowed opacity-60"
        >
          Encerrar sessão
        </Button>
      </div>
    </>
  );
}
