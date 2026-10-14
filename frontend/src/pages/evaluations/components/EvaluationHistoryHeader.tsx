import { Link } from 'react-router-dom';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';
import { UserMenuButton } from '@/components/layout/UserMenu';
import type { UserResponse } from '@/types/auth';
import { PAGE_CONTAINER_CLASS } from '@/components/ui/cardStyles';
import { cn } from '@/utils/cn';

type EvaluationHistoryHeaderProps = {
  user: UserResponse | null;
  backUrl: string;
};

export function EvaluationHistoryHeader({ user, backUrl }: EvaluationHistoryHeaderProps) {
  return (
    <header className="shrink-0 bg-brand-900 text-white shadow-xs">
      <div className={cn(PAGE_CONTAINER_CLASS, 'flex h-16 items-center justify-between')}>
        <div className="flex items-center gap-2">
          <Link
            to={backUrl}
            aria-label="Voltar para a sessão"
            className="-ml-1 rounded-full p-2 transition-[background-color,scale] duration-200 hover:bg-white/10 active:scale-90 focus-visible:outline-2 focus-visible:outline-white"
          >
            <ChevronLeftIcon className="size-6" />
          </Link>
          <h1 className="text-base font-semibold leading-tight">Histórico de avaliações</h1>
        </div>
        <UserMenuButton user={user} className="size-9 bg-brand-200 text-brand-900 font-bold" />
      </div>
    </header>
  );
}
