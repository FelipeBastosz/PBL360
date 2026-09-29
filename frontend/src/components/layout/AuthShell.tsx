import type { ReactNode } from 'react';
import { LogoMark } from '@/components/ui/LogoMark';
import { Wordmark } from '@/components/ui/Wordmark';
import { APP_TAGLINE } from '@/assets/brand';

type AuthShellProps = {
  children: ReactNode;
};

function DesktopHero() {
  return (
    <aside className="hidden flex-col items-center justify-center gap-8 p-12 text-card bg-brand-900 lg:flex">
      <LogoMark animated className="size-64 text-brand-900" discClassName="fill-card" />
      <Wordmark className="h-14 w-auto" />
      <p className="max-w-sm text-center text-xl text-card/80">{APP_TAGLINE}</p>
    </aside>
  );
}

export function AuthShell({ children }: AuthShellProps) {
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-2">
      <DesktopHero />
      <main className="flex min-h-dvh flex-col lg:items-center lg:justify-center lg:p-12">
        <div className="flex w-full flex-1 flex-col lg:max-w-md lg:flex-none">{children}</div>
      </main>
    </div>
  );
}
