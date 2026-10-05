import { ChevronLeftIcon } from '@heroicons/react/24/outline';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
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
      <header className="flex h-20 shrink-0 items-center gap-6 px-6 text-white bg-brand-900 lg:px-10">
        <Link
          to={backTo}
          aria-label={backLabel}
          className="-ml-2 rounded-full p-2 transition-[background-color,scale] duration-200 hover:bg-white/10 active:scale-90 focus-visible:outline-2 focus-visible:outline-white"
        >
          <ChevronLeftIcon className="size-7" aria-hidden />
        </Link>
        <div className="flex min-w-0 flex-1 flex-col animate-slide-down">
          <h1 className="truncate text-2xl leading-tight font-semibold">{title}</h1>
          {subtitle && <p className="truncate text-base text-white/70">{subtitle}</p>}
        </div>
        {trailing && <div className="shrink-0 animate-pop-in">{trailing}</div>}
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
