import { useEffect, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { BackHeader } from '@/components/layout/BackHeader';
import { Alert } from '@/components/ui/Alert';
import { Spinner } from '@/components/ui/Spinner';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { ROUTES } from '@/routes/paths';
import { sessionService } from '@/services/session.service';
import type { MemberSession } from '@/types/session';

const sessionHubPath = (session: MemberSession) =>
  `/turmas/${session.salaId}/problemas/${session.problemaId}/sessoes/${session.id}`;

export default function MemberSessionPage() {
  const { sessaoId = '' } = useParams<{ sessaoId: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<MemberSession | null>(null);
  const { run, error } = useAsyncAction(sessionService.getForMember);

  useEffect(() => {
    run(sessaoId).then((result) => result.ok && setSession(result.data));
  }, [run, sessaoId]);

  if (session) return <Navigate to={sessionHubPath(session)} replace />;

  return (
    <div className="min-h-dvh bg-surface pb-12">
      <BackHeader title="Sessão" subtitle="Problema" onBack={() => navigate(ROUTES.rooms)} />
      <main className="mx-auto mt-6 flex w-full max-w-md flex-col gap-6 px-4 sm:max-w-xl">
        {error ? (
          <Alert tone="error">{error.message}</Alert>
        ) : (
          <Spinner className="mx-auto mt-10 size-8 text-brand-900" />
        )}
      </main>
    </div>
  );
}
