import { Link } from 'react-router-dom';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';
import type { Problem } from '@/types/problem';

function getInitials(name?: string) {
  if (!name) return 'U';
  return name
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');
}

type HeaderProps = {
  problem: Problem | null;
  userNome?: string;
  backUrl: string;
};

export function ManageSessionsHeader({ problem, userNome, backUrl }: HeaderProps) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between bg-brand-900 px-4 text-white">
      <div className="flex items-center gap-3">
        <Link
          to={backUrl}
          aria-label="Voltar para as sessões"
          className="rounded-md p-1 hover:bg-white/10"
        >
          <ChevronLeftIcon className="size-6" />
        </Link>
        <h1 className="text-base font-semibold leading-tight">
          {problem?.titulo || 'Gerenciar Sessões'}
        </h1>
      </div>
      <div className="flex size-9 items-center justify-center rounded-full bg-brand-200 text-sm font-semibold text-brand-900">
        {getInitials(userNome)}
      </div>
    </header>
  );
}
