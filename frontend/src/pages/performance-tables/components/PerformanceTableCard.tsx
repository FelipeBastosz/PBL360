import { Link } from 'react-router-dom';
import { TrashIcon, UserIcon } from '@heroicons/react/24/outline';
import { ROUTES } from '@/routes/paths';
import type { PerformanceTableSummary } from '@/types/performanceTable';
import type { ApplyTarget } from '@/utils/navigationState';
import { cn } from '@/utils/cn';

type CardProps = {
  table: PerformanceTableSummary;
  isApplied: boolean;
  target: ApplyTarget | null;
  canDelete?: boolean;
  onDelete?: () => void;
};

function TableCardHeader({ name, isApplied }: { name: string; isApplied: boolean }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <h3 className="line-clamp-2 text-base font-bold text-brand-900">{name}</h3>
      {isApplied && (
        <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
          Aplicada
        </span>
      )}
    </div>
  );
}

function TableCardMeta({ authorName, inUseCount }: { authorName?: string; inUseCount?: number }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
      {authorName && (
        <span className="flex items-center gap-1 font-medium text-ink/70">
          <UserIcon className="size-3.5 shrink-0" aria-hidden="true" />
          {authorName}
        </span>
      )}
      {typeof inUseCount === 'number' && (
        <span className="font-medium text-ink/70">
          · {inUseCount} {inUseCount === 1 ? 'sessão em uso' : 'sessões em uso'}
        </span>
      )}
    </div>
  );
}

export function PerformanceTableCard({
  table,
  isApplied,
  target,
  canDelete = false,
  onDelete,
}: CardProps) {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-black/5 bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className={cn('h-1.5 w-full', isApplied ? 'bg-emerald-600' : 'bg-brand-900')} />
      <Link
        to={`${ROUTES.performanceTables}/${table.id}`}
        state={target}
        className="flex flex-col gap-2 p-4 text-left transition-colors hover:bg-gray-50/50"
      >
        <TableCardHeader name={table.nome} isApplied={isApplied} />
        {table.descricao && <p className="line-clamp-2 text-sm text-muted">{table.descricao}</p>}
        <TableCardMeta authorName={table.autor?.nome} inUseCount={table.emUso} />
      </Link>
      <div className="mt-auto flex items-center justify-between border-t border-black/5 px-4 py-2.5 text-xs font-semibold">
        <span className="rounded-full bg-brand-200 px-2.5 py-0.5 font-bold text-brand-900">
          {table.quantidadeCriterios} {table.quantidadeCriterios === 1 ? 'critério' : 'critérios'}
        </span>
        {canDelete && onDelete && (
          <button
            type="button"
            onClick={onDelete}
            aria-label={`Excluir fórmula ${table.nome}`}
            className="flex items-center justify-center rounded-full p-1.5 text-danger transition-colors hover:bg-danger/10 hover:opacity-80"
          >
            <TrashIcon className="size-5" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}
