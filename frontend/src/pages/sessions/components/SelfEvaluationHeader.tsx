import { ChevronLeftIcon } from '@heroicons/react/24/outline';
import { UserMenuButton } from '@/components/layout/UserMenu';
import { PAGE_CONTAINER_CLASS } from '@/components/ui/cardStyles';
import type { UserResponse } from '@/types/auth';
import { cn } from '@/utils/cn';
import { formatDeadline } from '@/utils/date';

export function SelfEvaluationHeader({
  user,
  subtitle,
  deadline,
  onBack,
}: {
  user: Pick<UserResponse, 'id' | 'nome' | 'possuiFoto'> | null;
  subtitle: string;
  deadline?: string | null;
  onBack: () => void;
}) {
  return (
    <header className="shrink-0 border-b border-brand-primary-border bg-brand-primary text-white">
      <div className={cn(PAGE_CONTAINER_CLASS, 'flex min-h-16 items-center justify-between py-2')}>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            aria-label="Voltar"
            className="-ml-1 rounded-full p-2 transition-[background-color,scale] duration-200 hover:bg-white/10 active:scale-90 focus-visible:outline-2 focus-visible:outline-white"
          >
            <ChevronLeftIcon className="size-6" />
          </button>
          <div className="flex flex-col">
            <h1 className="text-base font-semibold leading-tight">Autoavaliação</h1>
            <span className="text-xs text-white/70">{subtitle}</span>
            {deadline && (
              <span className="text-xs text-white/80">Prazo: {formatDeadline(deadline)}</span>
            )}
          </div>
        </div>
        <UserMenuButton user={user} className="ring-2 ring-white/20" />
      </div>
    </header>
  );
}
