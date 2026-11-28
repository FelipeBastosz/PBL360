import { ChevronLeftIcon } from '@heroicons/react/24/outline';
import { UserMenuButton } from '@/components/layout/UserMenu';
import { PAGE_CONTAINER_CLASS } from '@/components/ui/cardStyles';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/utils/cn';

type PokerHeaderProps = {
  title: string;
  subtitle: string;
  onBack: () => void;
};

export function PokerHeader({ title, subtitle, onBack }: PokerHeaderProps) {
  const { user } = useAuth();

  return (
    <header className="shrink-0 border-b border-brand-primary-border bg-brand-primary text-white">
      <div className={cn(PAGE_CONTAINER_CLASS, 'flex h-16 items-center gap-3')}>
        <button
          type="button"
          onClick={onBack}
          aria-label="Voltar"
          className="-ml-1 rounded-md p-1 hover:bg-white/10"
        >
          <ChevronLeftIcon className="size-6" aria-hidden />
        </button>
        <div className="flex min-w-0 flex-1 flex-col">
          <h1 className="truncate text-base leading-tight font-semibold">{title}</h1>
          <span className="truncate text-xs text-white/70">{subtitle}</span>
        </div>
        <UserMenuButton user={user} className="ring-2 ring-white/20" />
      </div>
    </header>
  );
}
