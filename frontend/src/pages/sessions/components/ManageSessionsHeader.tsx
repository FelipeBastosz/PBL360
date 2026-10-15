import { Link } from 'react-router-dom';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';
import { UserMenuButton } from '@/components/layout/UserMenu';
import type { UserResponse } from '@/types/auth';
import type { Problem } from '@/types/problem';
import { PAGE_CONTAINER_CLASS } from '@/components/ui/cardStyles';
import { cn } from '@/utils/cn';

type HeaderProps = {
  problem: Problem | null;
  userNome?: string;
  user?: Pick<UserResponse, 'id' | 'nome' | 'possuiFoto'> | null;
  backUrl: string;
};

export function ManageSessionsHeader({ problem, userNome, user, backUrl }: HeaderProps) {
  return (
    <header className="shrink-0 bg-brand-900 text-white">
      <div className={cn(PAGE_CONTAINER_CLASS, 'flex h-16 items-center justify-between')}>
        <div className="flex items-center gap-3">
          <Link
            to={backUrl}
            aria-label="Voltar para as sessões"
            className="-ml-1 rounded-full p-2 transition-[background-color,scale] duration-200 hover:bg-white/10 active:scale-90 focus-visible:outline-2 focus-visible:outline-white"
          >
            <ChevronLeftIcon className="size-6" />
          </Link>
          <h1 className="text-base font-semibold leading-tight">
            {problem?.titulo || 'Gerenciar Sessões'}
          </h1>
        </div>
        <UserMenuButton
          user={user ?? { id: '', nome: userNome ?? '', possuiFoto: false }}
          className="ring-2 ring-white/20"
        />
      </div>
    </header>
  );
}
