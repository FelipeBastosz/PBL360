import { useNavigate, useParams } from 'react-router-dom';
import { BackHeader } from '@/components/layout/BackHeader';
import { Alert } from '@/components/ui/Alert';
import { PAGE_CONTAINER_CLASS } from '@/components/ui/cardStyles';
import { Spinner } from '@/components/ui/Spinner';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/utils/cn';
import { SessionTableReportsSection } from './components/SessionTableReportsSection';
import { useProblemTableReports, type SessionTableReportsGroup } from './useProblemTableReports';
import type { ProblemTableReport } from '@/types/session';

type ContentProps = {
  isLoading: boolean;
  error: string | null;
  groups: SessionTableReportsGroup[];
  roomId: string;
  problemId: string;
  onDownload: (report: ProblemTableReport) => void;
};

function TableReportsContent({
  isLoading,
  error,
  groups,
  roomId,
  problemId,
  onDownload,
}: ContentProps) {
  if (error) return <Alert tone="error">{error}</Alert>;
  if (isLoading) {
    return (
      <div className="mt-10 flex justify-center">
        <Spinner className="size-8 text-brand-accent" />
      </div>
    );
  }
  if (groups.length === 0) {
    return (
      <p className="mt-10 text-center text-sm text-muted">
        Nenhuma sessão cadastrada neste problema.
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-4">
      {groups.map((group) => (
        <SessionTableReportsSection
          key={group.session.id}
          group={group}
          sessionPath={`/turmas/${roomId}/problemas/${problemId}/sessoes/${group.session.id}`}
          onDownload={onDownload}
        />
      ))}
    </div>
  );
}

export default function ProblemTableReportsPage() {
  const { roomId = '', problemId = '' } = useParams<{ roomId: string; problemId: string }>();
  const navigate = useNavigate();
  const isProfessor = useAuth().user?.tipo === 'PROFESSOR';
  const { room, problem, groups, isLoading, error, downloadReport } = useProblemTableReports(
    roomId,
    problemId,
    isProfessor,
  );

  const subtitle = [problem?.titulo || 'Problema', room?.nome].filter(Boolean).join(' · ');

  return (
    <div className="min-h-dvh bg-surface pb-12">
      <BackHeader
        title="Relatórios de Mesa"
        subtitle={subtitle}
        onBack={() => navigate(`/turmas/${roomId}/problemas/${problemId}`)}
      />
      <main className={cn(PAGE_CONTAINER_CLASS, 'mt-6 flex flex-col gap-4')}>
        <TableReportsContent
          isLoading={isLoading}
          error={error}
          groups={groups}
          roomId={roomId}
          problemId={problemId}
          onDownload={(report) => void downloadReport(report)}
        />
      </main>
    </div>
  );
}
