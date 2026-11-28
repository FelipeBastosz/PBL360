import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AppHeader } from '@/components/layout/AppHeader';
import { Alert } from '@/components/ui/Alert';
import { PAGE_CONTAINER_CLASS } from '@/components/ui/cardStyles';
import { ROUTES } from '@/routes/paths';
import type { ApiError } from '@/services/apiError';
import type { StudentPerformance } from '@/types/studentPerformance';
import { cn } from '@/utils/cn';
import { situationLabel } from '@/utils/studentPerformance';
import { ProblemFilter, StudentPicker } from './components/PerformanceFilters';
import { PerformanceOverview } from './components/PerformanceOverview';
import { TutorSessionDetails } from './components/SessionDetails';
import {
  PerformanceEmpty,
  PerformanceError,
  PerformanceForbidden,
  PerformanceLoading,
} from './components/PerformanceStates';
import { type PerformanceOptions, usePerformanceOptions } from './hooks/usePerformanceOptions';
import { useStudentPerformance } from './hooks/useStudentPerformance';
import { studentPerformancePath } from './studentPerformancePath';

const PROBLEM_PARAM = 'problema';

type ContentProps = {
  performance: StudentPerformance | null;
  error: ApiError | null;
  studentName: string;
  problemTitle: string | null;
  isFiltered: boolean;
  onRetry: () => void;
  onShowAll: () => void;
};

function emptyMessage(studentName: string, problemTitle: string | null) {
  const firstName = studentName.split(' ')[0] || 'O aluno';
  return problemTitle
    ? `${firstName} ainda não tem sessões registradas em ${problemTitle}.`
    : `${firstName} ainda não tem sessões registradas nesta turma.`;
}

function PerformanceContent(props: ContentProps) {
  const { performance, error, studentName, problemTitle } = props;
  if (error?.status === 403) return <PerformanceForbidden message={error.message} />;
  if (error) return <PerformanceError message={error.message} onRetry={props.onRetry} />;
  if (!performance) return <PerformanceLoading studentName={studentName} />;
  if (performance.sessoes.length === 0) {
    return (
      <PerformanceEmpty
        message={emptyMessage(studentName, problemTitle)}
        onShowAll={props.isFiltered ? props.onShowAll : undefined}
      />
    );
  }
  return (
    <PerformanceOverview
      key={performance.aluno.id}
      sessions={performance.sessoes}
      pendingNote={(session) => situationLabel(session.situacao)}
      renderDetails={(session) => <TutorSessionDetails session={session} />}
    />
  );
}

function resolveNames(
  options: PerformanceOptions | null,
  ids: { student: string; problem: string | null },
) {
  const student = options?.students.find((item) => item.id === ids.student);
  const problem = options?.problems.find((item) => item.id === ids.problem);
  return { studentName: student?.nome ?? '', problemTitle: problem?.titulo ?? null };
}

export default function StudentPerformancePage() {
  const { roomId = '', studentId = '' } = useParams<{ roomId: string; studentId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const problemId = searchParams.get(PROBLEM_PARAM);
  const { options, error: optionsError } = usePerformanceOptions(roomId);
  const { performance, error, reload } = useStudentPerformance({ roomId, studentId, problemId });
  const names = resolveNames(options, { student: studentId, problem: problemId });
  const studentName = names.studentName || performance?.aluno.nome || '';

  const changeProblem = (id: string | null) =>
    setSearchParams(id ? { [PROBLEM_PARAM]: id } : {}, { replace: true });
  const changeStudent = (id: string) =>
    navigate(
      { pathname: studentPerformancePath(roomId, id), search: searchParams.toString() },
      { replace: true },
    );

  return (
    <div className="min-h-dvh bg-surface pb-12">
      <AppHeader
        backUrl={ROUTES.roomMembers.replace(':id', roomId)}
        backAriaLabel="Voltar para a turma"
        title="Evolução do aluno"
        subtitle={performance?.sala.nome ?? ''}
      />
      <main className={cn(PAGE_CONTAINER_CLASS, 'mt-4 flex flex-col gap-4')}>
        <StudentPicker
          students={options?.students ?? null}
          studentId={studentId}
          studentName={studentName}
          onChange={changeStudent}
        />
        <ProblemFilter
          problems={options?.problems ?? null}
          selectedId={problemId}
          onChange={changeProblem}
        />
        {optionsError && <Alert tone="error">{optionsError.message}</Alert>}
        <PerformanceContent
          {...{ performance, error, studentName, problemTitle: names.problemTitle }}
          isFiltered={problemId !== null}
          onRetry={reload}
          onShowAll={() => changeProblem(null)}
        />
      </main>
    </div>
  );
}
