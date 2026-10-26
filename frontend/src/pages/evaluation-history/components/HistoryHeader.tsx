import { ChevronLeftIcon } from '@heroicons/react/24/outline';
import { UserMenuButton } from '@/components/layout/UserMenu';
import { PAGE_CONTAINER_CLASS } from '@/components/ui/cardStyles';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/utils/cn';

type HistoryHeaderProps = {
  onBack: () => void;
};

export function HistoryHeader({ onBack }: HistoryHeaderProps) {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-30 bg-brand-900 text-white">
      <div className={cn(PAGE_CONTAINER_CLASS, 'flex h-16 items-center justify-between')}>
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            aria-label="Voltar"
            className="-ml-1 rounded-full p-2 transition-[background-color,scale] duration-200 hover:bg-white/10 active:scale-90 focus-visible:outline-2 focus-visible:outline-white"
          >
            <ChevronLeftIcon className="size-6" strokeWidth={2} />
          </button>
          <h1 className="truncate text-base leading-tight font-semibold">
            Histórico de avaliações
          </h1>
        </div>
        <UserMenuButton user={user} />
      </div>
    </header>
  );
}
