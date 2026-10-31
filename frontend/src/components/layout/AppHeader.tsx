import { Link } from 'react-router-dom';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';
import { HorizontalLogo } from '@/components/ui/HorizontalLogo';
import { UserMenuButton } from '@/components/layout/UserMenu';
import { useAuth } from '@/hooks/useAuth';
import { PAGE_CONTAINER_CLASS } from '@/components/ui/cardStyles';
import { cn } from '@/utils/cn';

type AppHeaderProps = {
  backUrl?: string;
  onBack?: () => void;
  backAriaLabel?: string;
  title?: string;
  subtitle?: string;
};

export function AppHeader({
  backUrl,
  onBack,
  backAriaLabel = 'Voltar para a sessão',
  title,
  subtitle,
}: AppHeaderProps = {}) {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-10 bg-brand-900 text-white shadow-[0_6px_18px_-12px_rgb(0_0_119/0.8)]">
      <div className={cn(PAGE_CONTAINER_CLASS, 'flex h-16 items-center justify-between gap-3')}>
        <div className="flex min-w-0 items-center gap-3">
          {backUrl ? (
            <Link
              to={backUrl}
              aria-label={backAriaLabel}
              className="-ml-1 shrink-0 rounded-full p-2 text-white transition-[background-color,scale] duration-200 hover:bg-white/10 active:scale-90 focus-visible:outline-2 focus-visible:outline-white"
            >
              <ChevronLeftIcon className="size-6" />
            </Link>
          ) : onBack ? (
            <button
              type="button"
              onClick={onBack}
              aria-label={backAriaLabel}
              className="-ml-1 shrink-0 rounded-full p-2 text-white transition-[background-color,scale] duration-200 hover:bg-white/10 active:scale-90 focus-visible:outline-2 focus-visible:outline-white"
            >
              <ChevronLeftIcon className="size-6" />
            </button>
          ) : null}
          {title ? (
            <div className="flex min-w-0 flex-col animate-slide-down">
              <h1 className="truncate text-base font-semibold leading-tight text-white sm:text-lg">
                {title}
              </h1>
              {subtitle && <span className="truncate text-xs text-white/70">{subtitle}</span>}
            </div>
          ) : (
            <HorizontalLogo className="animate-slide-down" />
          )}
        </div>
        <UserMenuButton user={user} className="animate-pop-in ring-2 ring-white/20" />
      </div>
    </header>
  );
}
