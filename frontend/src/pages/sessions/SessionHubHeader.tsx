import { Link } from 'react-router-dom';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';
import { UserMenuButton } from '@/components/layout/UserMenu';
import type { UserResponse } from '@/types/auth';
import type { Problem } from '@/types/problem';
import type { Session } from '@/types/session';
import { PAGE_CONTAINER_CLASS } from '@/components/ui/cardStyles';
import { cn } from '@/utils/cn';

function formatSessionDate(dateString?: string) {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-');
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  const dayStr = date.toLocaleDateString('pt-BR', { day: '2-digit' });
  const monthStr = date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
  return `${dayStr} ${monthStr}`;
}

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
      <div className={cn(PAGE_CONTAINER_CLASS, 'flex h-16 items-center justify-between')}>
        <div className="flex items-center gap-3">
          <Link
            to={backUrl}
            aria-label="Voltar para as sessões"
            className="-ml-1 rounded-full p-2 transition-[background-color,scale] duration-200 hover:bg-white/10 active:scale-90 focus-visible:outline-2 focus-visible:outline-white"
          >
            <ChevronLeftIcon className="size-6" />
          </Link>
          <div className="flex flex-col">
            <h1 className="text-base font-semibold leading-tight">
              {session ? `${session.titulo} · ${formatSessionDate(session.data)}` : 'Sessão'}
            </h1>
            <span className="text-xs text-white/70">{problem?.titulo || 'Problema'}</span>
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
