import { ArrowRightStartOnRectangleIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { BrandHeader } from '@/components/layout/BrandHeader';
import { Button } from '@/components/ui/Button';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/routes/paths';
import { profileLabel } from '@/utils/profile';

export default function HomePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  function handleLogout() {
    logout();
    navigate(ROUTES.login, { replace: true });
  }

  return (
    <div className="min-h-dvh bg-surface">
      <header className="flex h-20 items-center justify-between bg-card px-6 shadow-sm lg:px-10">
        <BrandHeader />
        <Button variant="link" onClick={handleLogout} className="gap-1">
          <ArrowRightStartOnRectangleIcon className="size-5" aria-hidden />
          Sair
        </Button>
      </header>

      <main className="mx-auto flex max-w-3xl flex-col gap-4 px-6 py-10">
        <div className="flex items-center gap-5">
          <UserAvatar user={user} className="size-20 text-2xl" />
          <div className="flex min-w-0 flex-col gap-2">
            <h1 className="text-[1.75rem] font-semibold text-ink">Olá, {user?.nome}!</h1>
            <p className="text-brand-300">
              Você entrou como {user ? profileLabel(user.tipo) : ''} com {user?.email}.
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-4">
          <Button onClick={() => navigate(ROUTES.rooms)}>Ver Minhas Turmas</Button>
          {user?.tipo !== 'ALUNO' && (
            <Button variant="outline" onClick={() => navigate(ROUTES.performanceTables)}>
              Ver Minhas Fórmulas
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}
