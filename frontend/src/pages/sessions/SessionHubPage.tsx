import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { useAuth } from '@/hooks/useAuth';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { problemService } from '@/services/problem.service';
import { memberRoomService } from '@/services/memberRoom.service';
import { sessionService } from '@/services/session.service';
import type { Problem } from '@/types/problem';
import type { Session } from '@/types/session';
import { SessionHubHeader } from './SessionHubHeader';
import { SessionActionGrid } from './SessionActionGrid';
import { SessionEvaluationsCard } from './SessionEvaluationsCard';
import { SessionAttachments } from './SessionAttachments';

type SessionHubContentProps = {
  isLoading: boolean;
  isProfessor: boolean;
  basePath: string;
  sessionId: string;
};

function SessionHubContent({
  isLoading,
  isProfessor,
  basePath,
  sessionId,
}: SessionHubContentProps) {
  if (isLoading) {
    return (
      <div className="mt-10 flex justify-center">
        <Spinner className="size-8 text-brand-900" />
      </div>
    );
  }

  if (!isProfessor) return <SessionAttachments sessionId={sessionId} canUpload />;

  return (
    <>
      <SessionActionGrid basePath={basePath} />
      <SessionEvaluationsCard />
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

type HubParams = { roomId?: string; problemId?: string; sessionId?: string };

function useSessionHubData(isProfessor: boolean, { roomId, problemId, sessionId }: HubParams) {
  const [session, setSession] = useState<Session | null>(null);
  const [problem, setProblem] = useState<Pick<Problem, 'titulo'> | null>(null);

  const { run: fetchProblem } = useAsyncAction(problemService.getById);
  const { run: fetchSession, isLoading, error } = useAsyncAction(sessionService.getById);
  const {
    run: fetchStudentSession,
    isLoading: isLoadingStudent,
    error: studentError,
  } = useAsyncAction(memberRoomService.studentSession);

  useEffect(() => {
    if (!roomId || !problemId || !sessionId) return;
    if (!isProfessor) {
      fetchStudentSession(sessionId).then((r) => {
        if (!r.ok) return;
        setSession(r.data);
        setProblem({ titulo: r.data.problemaTitulo });
      });
      return;
    }
    fetchProblem(roomId, problemId).then((r) => r.ok && setProblem(r.data));
    fetchSession(roomId, problemId, sessionId).then((r) => r.ok && setSession(r.data));
  }, [isProfessor, roomId, problemId, sessionId, fetchProblem, fetchSession, fetchStudentSession]);

  return {
    session,
    problem,
    isLoading: isLoading || isLoadingStudent,
    error: error ?? studentError,
  };
}

export default function SessionHubPage() {
  const params = useParams<{ roomId: string; problemId: string; sessionId: string }>();
  const { roomId, problemId, sessionId } = params;
  const { user } = useAuth();
  const isProfessor = user?.tipo === 'PROFESSOR';
  const { session, problem, isLoading, error } = useSessionHubData(isProfessor, params);

  const basePath = `/turmas/${roomId}/problemas/${problemId}/sessoes/${sessionId}`;
  const backUrl = `/turmas/${roomId}/problemas/${problemId}`;

  return (
    <div className="min-h-dvh bg-surface pb-12">
      <SessionHubHeader
        session={session}
        problem={problem}
        userNome={user?.nome}
        user={user}
        backUrl={backUrl}
      />
      <main className="mx-auto mt-6 flex w-full max-w-md flex-col gap-4 px-4">
        {error ? (
          <Alert tone="error">{error.message}</Alert>
        ) : (
          <SessionHubContent
            isLoading={isLoading}
            isProfessor={isProfessor}
            basePath={basePath}
            sessionId={sessionId ?? ''}
          />
        )}
      </main>
    </div>
  );
}
