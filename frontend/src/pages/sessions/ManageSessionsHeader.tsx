import { Link } from 'react-router-dom';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';
import { UserAvatar } from '@/components/ui/UserAvatar';
import type { UserResponse } from '@/types/auth';
import type { Problem } from '@/types/problem';

type HeaderProps = {
  problem: Problem | null;
  userNome?: string;
  user?: Pick<UserResponse, 'id' | 'nome' | 'possuiFoto'> | null;
  backUrl: string;
};

export function ManageSessionsHeader({ problem, userNome, user, backUrl }: HeaderProps) {
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
      <UserAvatar
        user={user ?? { id: '', nome: userNome ?? '', possuiFoto: false }}
        className="ring-2 ring-white/20"
      />
    </header>
  );
}
