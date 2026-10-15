import { Link } from 'react-router-dom';
import { ROUTES } from '@/routes/paths';
import type { PerformanceTableSummary } from '@/types/performanceTable';
import type { ApplyTarget } from '@/utils/navigationState';
import { cn } from '@/utils/cn';

type CardProps = {
  table: PerformanceTableSummary;
  isApplied: boolean;
  target: ApplyTarget | null;
};

export function PerformanceTableCard({ table, isApplied, target }: CardProps) {
  return (
    <Link
      to={`${ROUTES.performanceTables}/${table.id}`}
      state={target}
      className="flex flex-col overflow-hidden rounded-xl border border-black/5 bg-white shadow-sm transition-shadow hover:shadow-md"
    >
      <div className={cn('h-1.5 w-full', isApplied ? 'bg-emerald-600' : 'bg-brand-900')} />
      <div className="flex flex-col gap-3 p-4">
        <div>
          <div className="flex items-center justify-between gap-2">
            <h3 className="line-clamp-2 text-base font-bold text-brand-900">{table.nome}</h3>
            {isApplied && (
              <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
                Aplicada
              </span>
            )}
          </div>
          {table.descricao && (
            <p className="mt-1 line-clamp-2 text-sm text-muted">{table.descricao}</p>
          )}
        </div>
        <div className="mt-1 flex items-center justify-end text-xs font-semibold">
          <span className="rounded-full bg-brand-200 px-2.5 py-0.5 font-bold text-brand-900">
            {table.quantidadeCriterios} {table.quantidadeCriterios === 1 ? 'critério' : 'critérios'}
          </span>
        </div>
      </div>
    </Link>
  );
}
