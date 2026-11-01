import { Link } from 'react-router-dom';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';
import { UserMenuButton } from '@/components/layout/UserMenu';
import type { UserResponse } from '@/types/auth';
import type { Problem } from '@/types/problem';
import type { Session } from '@/types/session';
import { PAGE_CONTAINER_CLASS } from '@/components/ui/cardStyles';
import { formatSessionDisplayDate } from '@/utils/sessionsForm';
import { cn } from '@/utils/cn';

type HeaderProps = {
  session: Session | null;
  problem: Pick<Problem, 'titulo'> | null;
  userNome?: string;
  user?: Pick<UserResponse, 'id' | 'nome' | 'possuiFoto'> | null;
  backUrl: string;
};

export function SessionHubHeader({ session, problem, userNome, user, backUrl }: HeaderProps) {
  return (
    <header className="shrink-0 bg-brand-900 text-white">
      <div className={cn(PAGE_CONTAINER_CLASS, 'flex h-16 items-center justify-between gap-3')}>
        <div className="flex min-w-0 items-center gap-3">
          <Link
            to={backUrl}
            aria-label="Voltar para as sessões"
            className="-ml-1 shrink-0 rounded-full p-2 transition-[background-color,scale] duration-200 hover:bg-white/10 active:scale-90 focus-visible:outline-2 focus-visible:outline-white"
          >
            <ChevronLeftIcon className="size-6" />
          </Link>
          <div className="flex min-w-0 flex-col">
            <h1 className="truncate text-base font-semibold leading-tight">
              {session ? `${session.titulo} · ${formatSessionDisplayDate(session.data)}` : 'Sessão'}
            </h1>
            <span className="truncate text-xs text-white/70">{problem?.titulo || 'Problema'}</span>
          </div>
        </div>
        <UserMenuButton
          user={user ?? { id: '', nome: userNome ?? '', possuiFoto: false }}
          className="ring-2 ring-white/20"
        />
      </div>
    </header>
  );
}
