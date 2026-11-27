import { Link, useParams } from 'react-router-dom';
import { BrandHero } from '@/components/layout/BrandHero';
import { Alert } from '@/components/ui/Alert';
import { Spinner } from '@/components/ui/Spinner';
import { ROUTES } from '@/routes/paths';
import { useJoinRoomByLink } from './useJoinRoomByLink';

function JoinErrorContent({ message }: { message: string }) {
  return (
    <div className="flex w-full max-w-md flex-col items-center gap-5">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-ink">Não foi possível entrar na turma</h1>
      </div>
      <Alert tone="error" className="w-full text-left">
        {message}
      </Alert>
      <Link to={ROUTES.rooms} className="font-semibold text-brand-900 hover:underline">
        Ir para minhas turmas
      </Link>
    </div>
  );
}

function JoinLoadingContent() {
  return (
    <div className="flex flex-col items-center gap-3">
      <Spinner className="size-8 text-brand-900" label="Entrando na turma" />
      <p className="text-sm font-medium text-muted">Entrando na turma…</p>
    </div>
  );
}

export default function JoinRoomByLinkPage() {
  const { codigoSala } = useParams<{ codigoSala: string }>();
  const { isLoading, errorMessage } = useJoinRoomByLink(codigoSala);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-surface px-6 text-center">
      <BrandHero />
      {isLoading ? <JoinLoadingContent /> : <JoinErrorContent message={errorMessage ?? ''} />}
    </main>
  );
}
