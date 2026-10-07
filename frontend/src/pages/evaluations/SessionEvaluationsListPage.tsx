import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeftIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { useAuth } from '@/hooks/useAuth';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { evaluationService } from '@/services/evaluation.service';
import type { SessionEvaluationSummary, ProblemEvaluationCriteria } from '@/types/evaluation';
import { StudentEvaluationCard } from './components/StudentEvaluationCard';
import { UserAvatar } from '@/components/ui/UserAvatar';
import type { UserResponse } from '@/types/auth';

function EvaluationsHeader({ user, backUrl }: { user: UserResponse | null; backUrl: string }) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between bg-brand-900 px-4 text-white">
      <div className="flex items-center gap-3">
        <Link
          to={backUrl}
          aria-label="Voltar para a sessão"
          className="rounded-md p-1 hover:bg-white/10"
        >
          <ChevronLeftIcon className="size-6" />
        </Link>
        <div className="flex flex-col">
          <h1 className="text-base font-semibold leading-tight">Avaliação</h1>
          <span className="text-xs text-white/70">Alunos</span>
        </div>
      </div>
      <UserAvatar user={user} className="size-9 bg-brand-200 text-brand-900" />
    </header>
  );
}

function MissingCriteriaAlert({ formulasUrl }: { formulasUrl: string }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border-2 border-amber-300 bg-amber-50 p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <ExclamationTriangleIcon className="mt-0.5 size-6 shrink-0 text-amber-700" />
        <div>
          <h3 className="text-sm font-bold text-amber-900">Problema sem tabela vinculada</h3>
          <p className="mt-0.5 text-xs leading-relaxed text-amber-800">
            Este problema ainda não possui critérios de avaliação configurados. Vincule uma tabela
            de fórmulas para liberar o lançamento de notas.
          </p>
        </div>
      </div>
      <Link
        to={formulasUrl}
        className="w-full rounded-xl bg-amber-700 py-2 text-center text-xs font-semibold text-white transition hover:bg-amber-800"
      >
        Configurar Fórmulas
      </Link>
    </div>
  );
}

function useSessionEvaluationsData(sessionId?: string, roomId?: string, problemId?: string) {
  const [students, setStudents] = useState<SessionEvaluationSummary[]>([]);
  const [criteria, setCriteria] = useState<ProblemEvaluationCriteria | null>(null);
  const [hasCheckedCriteria, setHasCheckedCriteria] = useState(false);

  const {
    run: fetchStudents,
    isLoading: isLoadingStudents,
    error,
  } = useAsyncAction(evaluationService.listBySession);
  const { run: fetchCriteria, isLoading: isLoadingCriteria } = useAsyncAction(
    evaluationService.getProblemCriteria,
  );

  useEffect(() => {
    if (sessionId) {
      fetchStudents(sessionId).then((r) => r.ok && setStudents(r.data));
    }
    if (roomId && problemId) {
      fetchCriteria(roomId, problemId)
        .then((r) => {
          if (r.ok) setCriteria(r.data);
        })
        .finally(() => setHasCheckedCriteria(true));
    }
  }, [sessionId, roomId, problemId, fetchStudents, fetchCriteria]);

  const isLoading = isLoadingStudents || isLoadingCriteria;
  const hasMissingTable = hasCheckedCriteria && (!criteria || !criteria.tabela);

  return { students, isLoading, error, hasMissingTable };
}

export default function SessionEvaluationsListPage() {
  const { roomId, problemId, sessionId } = useParams<{
    roomId: string;
    problemId: string;
    sessionId: string;
  }>();
  const { user } = useAuth();
  const { students, isLoading, error, hasMissingTable } = useSessionEvaluationsData(
    sessionId,
    roomId,
    problemId,
  );

  const backUrl = `/turmas/${roomId}/problemas/${problemId}/sessoes/${sessionId}`;
  const formulasUrl = `/turmas/${roomId}/problemas/${problemId}/sessoes/${sessionId}/formulas`;

  return (
    <div className="min-h-dvh bg-surface pb-12">
      <EvaluationsHeader user={user} backUrl={backUrl} />
      <main className="mx-auto mt-6 flex w-full max-w-md flex-col gap-4 px-4">
        {error && <Alert tone="error">{error.message}</Alert>}
        {hasMissingTable && <MissingCriteriaAlert formulasUrl={formulasUrl} />}
        {isLoading ? (
          <div className="mt-10 flex justify-center">
            <Spinner className="size-8 text-brand-900" />
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {students.map((student) => (
              <StudentEvaluationCard
                key={student.alunoId}
                student={student}
                disabled={hasMissingTable}
                evaluationUrl={`/sessoes/${sessionId}/avaliacao/${student.alunoId}`}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
