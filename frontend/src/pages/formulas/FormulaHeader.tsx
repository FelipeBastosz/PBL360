import { Link } from 'react-router-dom';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';
import { UserMenuButton } from '@/components/layout/UserMenu';
import type { UserResponse } from '@/types/auth';
import type { FormulaScope } from '@/types/formula';
import { cn } from '@/utils/cn';
import { SCOPE_TABS } from '@/utils/formula';

type FormulaHeaderProps = {
  user: Pick<UserResponse, 'id' | 'nome' | 'possuiFoto'> | null;
  backTo: string;
  scope: FormulaScope;
  onScopeChange: (scope: FormulaScope) => void;
};

export function FormulaHeader({ user, backTo, scope, onScopeChange }: FormulaHeaderProps) {
  return (
    <header className="sticky top-0 z-10 bg-brand-900 text-white shadow-[0_6px_18px_-12px_rgb(0_0_119/0.8)]">
      <div className="mx-auto flex h-20 w-full max-w-md items-center gap-3 px-4">
        <Link
          to={backTo}
          aria-label="Voltar para a sessão"
          className="-ml-1 rounded-full p-2 transition-[background-color,scale] duration-200 hover:bg-white/10 active:scale-90 focus-visible:outline-2 focus-visible:outline-white"
        >
          <ChevronLeftIcon className="size-6" aria-hidden />
        </Link>
        <h1 className="flex-1 text-xl font-semibold">Fórmulas</h1>
        <UserMenuButton user={user} className="ring-2 ring-white/20" />
      </div>
      <div role="tablist" className="mx-auto flex w-full max-w-md">
        {SCOPE_TABS.map((tab) => (
          <button
            key={tab.scope}
            type="button"
            role="tab"
            id={`tab-${tab.scope}`}
            aria-selected={scope === tab.scope}
            aria-controls={`panel-${tab.scope}`}
            onClick={() => onScopeChange(tab.scope)}
            className={cn(
              'flex-1 border-b-2 py-3 text-base font-semibold transition-colors',
              scope === tab.scope
                ? 'border-white text-white'
                : 'border-transparent text-white/60 hover:text-white/80',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </header>
  );
}
