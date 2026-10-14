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

function SessionCloseFooter() {
  return (
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
  );
}

export function SessionHubContent(props: SessionHubContentProps) {
  if (props.isLoading) {
    return (
      <div className="mt-10 flex justify-center">
        <Spinner className="size-8 text-brand-900" />
      </div>
    );
  }
  const isStudentEvalActive = Boolean(
    props.releases?.autoavaliacao.liberada || props.releases?.pares.liberada,
  );
  const pokerPath = `${props.basePath}/planning-poker`;

  if (!props.isProfessor)
    return <StudentHubContent sessionId={props.sessionId} pokerPath={pokerPath} />;

  return (
    <>
      <SessionActionGrid basePath={props.basePath} isStudentEvalActive={isStudentEvalActive}>
        <PlanningPokerHubCard
          sessionId={props.sessionId}
          pokerPath={pokerPath}
          refreshKey={props.releases}
        />
      </SessionActionGrid>
      <SessionEvaluationsCard
        releases={props.releases}
        onToggle={props.onToggle}
        isAttendancePending={props.isAttendancePending}
        isLoading={props.isUpdating}
      />
      <SessionAttachments sessionId={props.sessionId} canUpload />
      <SessionCloseFooter />
    </>
  );
}
