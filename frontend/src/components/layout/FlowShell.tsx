import { ChevronLeftIcon } from '@heroicons/react/24/outline';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

type FlowShellProps = {
  title: string;
  backTo: string;
  backLabel?: string;
  children: ReactNode;
};

export function FlowShell({ title, backTo, backLabel = 'Voltar', children }: FlowShellProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-surface">
      <header className="flex h-20 shrink-0 items-center gap-6 px-6 text-white bg-brand-900 lg:px-10">
        <Link
          to={backTo}
          aria-label={backLabel}
          className="-ml-2 rounded-md p-2 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-white"
        >
          <ChevronLeftIcon className="size-7" aria-hidden />
        </Link>
        <h1 className="text-2xl font-semibold">{title}</h1>
      </header>
      <main className="flex flex-1 justify-center px-6 pt-14 pb-10 lg:items-start lg:pt-16">
        <div className="w-full max-w-sm lg:max-w-md lg:rounded-[20px] lg:border lg:border-black/5 lg:p-10 lg:bg-white lg:shadow-xl">
          {children}
        </div>
      </main>
    </div>
  );
}
