import { useNavigate } from 'react-router-dom';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';
import { UserMenuButton } from '@/components/layout/UserMenu';
import { useAuth } from '@/hooks/useAuth';
import { PAGE_CONTAINER_CLASS } from '@/components/ui/cardStyles';
import { cn } from '@/utils/cn';

export function EvaluationHeader({ onBack }: { onBack?: () => void }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <header className="shrink-0 bg-brand-900 text-white">
      <div className={cn(PAGE_CONTAINER_CLASS, 'flex h-16 items-center justify-between gap-3')}>
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onBack ?? (() => navigate(-1))}
            aria-label="Voltar"
            className="-ml-1 shrink-0 rounded-full p-2 transition-[background-color,scale] duration-200 hover:bg-white/10 active:scale-90 focus-visible:outline-2 focus-visible:outline-white"
          >
            <ChevronLeftIcon className="size-6" strokeWidth={2} />
          </button>
          <div className="flex min-w-0 flex-col">
            <h1 className="truncate text-base font-bold leading-tight">Avaliação</h1>
            <span className="text-xs text-white/70">Aluno</span>
          </div>
        </div>
        <UserMenuButton user={user} />
      </div>
    </header>
  );
}
