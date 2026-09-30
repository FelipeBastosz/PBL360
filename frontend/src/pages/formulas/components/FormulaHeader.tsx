import { ChevronLeftIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/routes/paths';

export function FormulaHeader() {
  const { user } = useAuth();

  return (
    <header className="flex h-16 shrink-0 items-center justify-between bg-brand-900 px-4 text-white">
      <Link
        to={ROUTES.home}
        aria-label="Voltar"
        className="-ml-2 rounded-full p-2 transition-[background-color,transform] duration-200 hover:bg-white/10 active:scale-90 focus-visible:outline-2 focus-visible:outline-white"
      >
        <ChevronLeftIcon className="size-6" aria-hidden />
      </Link>
      <h1 className="text-lg font-semibold">Fórmulas</h1>
      <UserAvatar user={user} className="size-8 bg-brand-100 text-brand-900" />
    </header>
  );
}
