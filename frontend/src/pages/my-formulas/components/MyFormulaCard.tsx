import { Link } from 'react-router-dom';
import { TrashIcon, UserIcon } from '@heroicons/react/24/outline';
import { ROUTES } from '@/routes/paths';
import type { PerformanceTableSummary } from '@/types/performanceTable';

type MyFormulaCardProps = {
  table: PerformanceTableSummary;
  onDelete: () => void;
};

export function MyFormulaCard({ table, onDelete }: MyFormulaCardProps) {
  const authorName = table.autor?.nome;

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-black/5 bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="h-1.5 w-full bg-brand-900" />
      <Link
        to={`${ROUTES.myFormulas}/${table.id}`}
        className="flex flex-col gap-2 p-4 text-left transition-colors hover:bg-gray-50/50"
      >
        <h3 className="line-clamp-2 text-base font-bold text-brand-900">{table.nome}</h3>
        {table.descricao && <p className="line-clamp-2 text-sm text-muted">{table.descricao}</p>}
        {authorName && (
          <div className="flex items-center gap-1 text-xs font-medium text-ink/70">
            <UserIcon className="size-3.5 shrink-0" aria-hidden="true" />
            <span>{authorName}</span>
          </div>
        )}
      </Link>
      <div className="mt-auto flex items-center justify-between border-t border-black/5 px-4 py-2.5 text-xs font-semibold">
        <span className="rounded-full bg-brand-200 px-2.5 py-0.5 font-bold text-brand-900">
          {table.quantidadeCriterios} {table.quantidadeCriterios === 1 ? 'critério' : 'critérios'}
        </span>
        <button
          type="button"
          onClick={onDelete}
          aria-label={`Excluir fórmula ${table.nome}`}
          className="flex items-center justify-center rounded-full p-1.5 text-danger transition-colors hover:bg-danger/10 hover:opacity-80"
        >
          <TrashIcon className="size-5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
