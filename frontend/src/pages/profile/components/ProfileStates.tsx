import { useNavigate } from 'react-router-dom';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { BackHeader } from '@/components/layout/BackHeader';
import { PAGE_CONTAINER_CLASS } from '@/components/ui/cardStyles';
import { cn } from '@/utils/cn';
import { ROUTES } from '@/routes/paths';

export function ProfileLoadingState() {
  const navigate = useNavigate();

  return (
    <div className="min-h-dvh bg-surface">
      <BackHeader title="Meu Perfil" subtitle="Minha Conta" onBack={() => navigate(ROUTES.rooms)} />
      <main className={cn(PAGE_CONTAINER_CLASS, 'flex min-h-[60vh] items-center justify-center')}>
        <Spinner className="size-8 text-brand-900" />
      </main>
    </div>
  );
}

export function ProfileErrorState({
  error,
  onRetry,
}: {
  error: string | null;
  onRetry: () => void;
}) {
  const navigate = useNavigate();

  return (
    <div className="min-h-dvh bg-surface">
      <BackHeader title="Meu Perfil" subtitle="Minha Conta" onBack={() => navigate(ROUTES.rooms)} />
      <main className={cn(PAGE_CONTAINER_CLASS, 'flex flex-col items-center justify-center py-12')}>
        <Alert tone="error">
          {error ?? 'Não foi possível carregar as informações do seu perfil.'}
        </Alert>
        <Button onClick={onRetry} className="mt-4">
          Tentar novamente
        </Button>
      </main>
    </div>
  );
}
