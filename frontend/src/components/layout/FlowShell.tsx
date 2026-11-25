import { ChevronLeftIcon } from '@heroicons/react/24/outline';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { PAGE_CONTAINER_CLASS } from '@/components/ui/cardStyles';
import { cn } from '@/utils/cn';

type FlowShellProps = {
  title: string;
  subtitle?: string;
  trailing?: ReactNode;
  backTo: string;
  backLabel?: string;
  children: ReactNode;
};

export function FlowShell({
  title,
  subtitle,
  trailing,
  backTo,
  backLabel = 'Voltar',
  children,
}: FlowShellProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-surface">
      <header className="sticky top-0 z-10 bg-brand-900 text-white shadow-[0_6px_18px_-12px_rgb(0_0_119/0.8)]">
        <div className={cn(PAGE_CONTAINER_CLASS, 'flex h-16 items-center justify-between gap-3')}>
          <div className="flex min-w-0 items-center gap-3">
            <Link
              to={backTo}
              aria-label={backLabel}
              className="-ml-1 shrink-0 rounded-full p-2 text-white transition-[background-color,scale] duration-200 hover:bg-white/10 active:scale-90 focus-visible:outline-2 focus-visible:outline-white"
            >
              <ChevronLeftIcon className="size-6" aria-hidden />
            </Link>
            <div className="flex min-w-0 flex-col animate-slide-down">
              <h1 className="truncate text-base font-semibold leading-tight text-white sm:text-lg">
                {title}
              </h1>
              {subtitle && <span className="truncate text-xs text-white/70">{subtitle}</span>}
            </div>
          </div>
          {trailing && <div className="shrink-0 animate-pop-in">{trailing}</div>}
        </div>
      </header>
      <main
        className={cn(
          'flex flex-1 justify-center px-6 pb-10 lg:items-start lg:pt-16',
          subtitle ? 'pt-6' : 'pt-14',
        )}
      >
        <div className="w-full max-w-sm lg:max-w-md lg:rounded-[20px] lg:border lg:border-black/5 lg:p-10 lg:bg-white lg:shadow-xl">
          {children}
        </div>
      </main>
    </div>
  );
}
