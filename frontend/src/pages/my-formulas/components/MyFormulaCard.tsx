import { Link } from 'react-router-dom';
import { ROUTES } from '@/routes/paths';
import type { PerformanceTableSummary } from '@/types/performanceTable';

type MyFormulaCardProps = {
  table: PerformanceTableSummary;
};

export function MyFormulaCard({ table }: MyFormulaCardProps) {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-border-subtle bg-elevated shadow-sm transition-shadow hover:shadow-md">
      <div className="h-1.5 w-full bg-brand-stripe" />
      <Link
        to={`${ROUTES.myFormulas}/${table.id}`}
        className="flex flex-col gap-2 p-4 text-left transition-colors hover:bg-subtle/50"
      >
        <h3 className="line-clamp-2 text-base font-bold text-brand-accent">{table.nome}</h3>
        {table.descricao && <p className="line-clamp-2 text-sm text-muted">{table.descricao}</p>}
      </Link>
      <div className="mt-auto border-t border-border-subtle px-4 py-2.5 text-xs font-semibold">
        <span className="rounded-full bg-brand-soft px-2.5 py-0.5 font-bold text-brand-accent">
          {table.quantidadeCriterios} {table.quantidadeCriterios === 1 ? 'critério' : 'critérios'}
        </span>
      </div>
    </div>
  );
}
