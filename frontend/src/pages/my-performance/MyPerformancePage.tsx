import { useParams, useSearchParams } from 'react-router-dom';
import { AppHeader } from '@/components/layout/AppHeader';
import { PAGE_CONTAINER_CLASS } from '@/components/ui/cardStyles';
import { ProblemFilter } from '@/pages/student-performance/components/PerformanceFilters';
import { PerformanceOverview } from '@/pages/student-performance/components/PerformanceOverview';
import {
  PerformanceEmpty,
  PerformanceError,
  PerformanceForbidden,
  PerformanceLoading,
} from '@/pages/student-performance/components/PerformanceStates';
import { ROUTES } from '@/routes/paths';
import type { ApiError } from '@/services/apiError';
import { cn } from '@/utils/cn';
import { type MyPerformance, useMyPerformance } from './hooks/useMyPerformance';
import { MySessionDetails } from './MySessionDetails';

const PROBLEM_PARAM = 'problema';
const AWAITING_RELEASE = 'Aguardando liberação';

type ContentProps = {
  performance: MyPerformance | null;
  error: ApiError | null;
  problemId: string | null;
  onRetry: () => void;
  onShowAll: () => void;
};

function emptyMessage(performance: MyPerformance, problemId: string | null) {
  const problem = performance.problems.find((item) => item.id === problemId);
  return problem
    ? `Você ainda não tem sessões registradas em ${problem.titulo}.`
    : 'Você ainda não tem sessões registradas nesta turma.';
}

function MyPerformanceContent({ performance, error, problemId, onRetry, onShowAll }: ContentProps) {
  if (error?.status === 403) return <PerformanceForbidden message={error.message} />;
  if (error) return <PerformanceError message={error.message} onRetry={onRetry} />;
  if (!performance) return <PerformanceLoading studentName="" />;
  // Every problem is already loaded, so the filter only narrows what is on screen.
  const sessions = problemId
    ? performance.sessions.filter((session) => session.problemaId === problemId)
    : performance.sessions;
  if (sessions.length === 0) {
    return (
      <PerformanceEmpty
        message={emptyMessage(performance, problemId)}
        onShowAll={problemId ? onShowAll : undefined}
      />
    );
  }
  return (
    <PerformanceOverview
      key={problemId ?? 'all'}
      sessions={sessions}
      pendingNote={() => AWAITING_RELEASE}
      renderDetails={(session) => <MySessionDetails session={session} />}
    />
  );
}

export default function MyPerformancePage() {
  const { roomId = '' } = useParams<{ roomId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const problemId = searchParams.get(PROBLEM_PARAM);
  const { performance, error, reload } = useMyPerformance(roomId);

  const changeProblem = (id: string | null) =>
    setSearchParams(id ? { [PROBLEM_PARAM]: id } : {}, { replace: true });

  return (
    <div className="min-h-dvh bg-surface pb-12">
      <AppHeader
        backUrl={ROUTES.roomProblems.replace(':id', roomId)}
        backAriaLabel="Voltar para a turma"
        title="Minha evolução"
        subtitle={performance?.roomName ?? ''}
      />
      <main className={cn(PAGE_CONTAINER_CLASS, 'mt-4 flex flex-col gap-4')}>
        <p className="text-sm text-muted">
          Suas notas aparecem aqui assim que o professor as libera.
        </p>
        <ProblemFilter
          problems={performance?.problems ?? null}
          selectedId={problemId}
          onChange={changeProblem}
        />
        <MyPerformanceContent
          {...{ performance, error, problemId }}
          onRetry={reload}
          onShowAll={() => changeProblem(null)}
        />
      </main>
    </div>
  );
}
