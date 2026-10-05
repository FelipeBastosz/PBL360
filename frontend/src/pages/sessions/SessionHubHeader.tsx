import { Link } from 'react-router-dom';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';
import type { Problem } from '@/types/problem';
import type { Session } from '@/types/session';

function formatSessionDate(dateString?: string) {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-');
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  const dayStr = date.toLocaleDateString('pt-BR', { day: '2-digit' });
  const monthStr = date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
  return `${dayStr} ${monthStr}`;
}

function getInitials(name?: string) {
  if (!name) return 'U';
  return name
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');
}

type HeaderProps = {
  session: Session | null;
  problem: Problem | null;
  userNome?: string;
  backUrl: string;
};

export function SessionHubHeader({ session, problem, userNome, backUrl }: HeaderProps) {
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
        <div className="flex flex-col">
          <h1 className="text-base font-semibold leading-tight">
            {session ? `${session.titulo} · ${formatSessionDate(session.data)}` : 'Sessão'}
          </h1>
          <span className="text-xs text-white/70">{problem?.titulo || 'Problema'}</span>
        </div>
      </div>
      <div className="flex size-9 items-center justify-center rounded-full bg-brand-200 text-sm font-semibold text-brand-900">
        {getInitials(userNome)}
      </div>
    </header>
  );
}
