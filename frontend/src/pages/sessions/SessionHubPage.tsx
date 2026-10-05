import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { useAuth } from '@/hooks/useAuth';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { problemService } from '@/services/problem.service';
import { sessionService } from '@/services/session.service';
import type { Problem } from '@/types/problem';
import type { Session } from '@/types/session';
import { SessionHubHeader } from './SessionHubHeader';
import { SessionActionGrid } from './SessionActionGrid';
import { SessionEvaluationsCard } from './SessionEvaluationsCard';

function SessionHubContent({ isLoading, basePath }: { isLoading: boolean; basePath: string }) {
  if (isLoading) {
    return (
      <div className="mt-10 flex justify-center">
        <Spinner className="size-8 text-brand-900" />
      </div>
    );
  }

  return (
    <>
      <SessionActionGrid basePath={basePath} />
      <SessionEvaluationsCard />
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

export default function SessionHubPage() {
  const { roomId, problemId, sessionId } = useParams<{
    roomId: string;
    problemId: string;
    sessionId: string;
  }>();
  const { user } = useAuth();

  const [session, setSession] = useState<Session | null>(null);
  const [problem, setProblem] = useState<Problem | null>(null);

  const { run: fetchProblem } = useAsyncAction(problemService.getById);
  const { run: fetchSession, isLoading } = useAsyncAction(sessionService.getById);

  useEffect(() => {
    if (roomId && problemId && sessionId) {
      fetchProblem(roomId, problemId).then((r) => r.ok && setProblem(r.data));
      fetchSession(roomId, problemId, sessionId).then((r) => r.ok && setSession(r.data));
    }
  }, [roomId, problemId, sessionId, fetchProblem, fetchSession]);

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
        <SessionHubContent isLoading={isLoading} basePath={basePath} />
      </main>
    </div>
  );
}
