import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeftIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { UserMenuButton } from '@/components/layout/UserMenu';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { useAuth } from '@/hooks/useAuth';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { performanceTableService } from '@/services/performance-table.service';
import { ROUTES } from '@/routes/paths';
import type { PerformanceTableSummary } from '@/types/performanceTable';
import { cn } from '@/utils/cn';
import { PAGE_CONTAINER_CLASS } from '@/components/ui/cardStyles';

function ManageHeader() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="shrink-0 bg-brand-900 text-white">
      <div className={cn(PAGE_CONTAINER_CLASS, 'flex h-16 items-center justify-between')}>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            aria-label="Voltar"
            className="-ml-1 rounded-full p-2 transition-[background-color,scale] duration-200 hover:bg-white/10 active:scale-90 focus-visible:outline-2 focus-visible:outline-white"
          >
            <ChevronLeftIcon className="size-6" strokeWidth={2} />
          </button>
          <h1 className="text-lg font-bold">Fórmulas</h1>
        </div>
        <UserMenuButton user={user} />
      </div>
    </header>
  );
}

function ManageSearch({ query, setQuery }: { query: string; setQuery: (q: string) => void }) {
  return (
    <div className="relative mt-4 px-4">
      <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center pl-3">
        <MagnifyingGlassIcon className="size-5 text-placeholder" aria-hidden />
      </div>
      <input
        type="text"
        placeholder="Pesquisar fórmula"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="h-12 w-full rounded-[10px] border border-black/10 bg-white pl-10 pr-4 text-ink placeholder:text-placeholder focus:border-brand-900 focus:outline-none focus:ring-1 focus:ring-brand-900"
      />
    </div>
  );
}

function FormulaSelectItem({
  table,
  isSelected,
  onSelect,
}: {
  table: PerformanceTableSummary;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'w-full rounded-[18px] border p-4 text-left font-bold transition-all shadow-sm',
        isSelected
          ? 'border-brand-900 bg-brand-50 text-brand-900 ring-2 ring-brand-900'
          : 'border-black/5 bg-white text-brand-900 hover:bg-gray-50',
      )}
    >
      {table.nome}
    </button>
  );
}

function FormulaSelectList({
  tables,
  selectedId,
  onSelect,
}: {
  tables: PerformanceTableSummary[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  if (tables.length === 0) {
    return <p className="mt-8 text-center text-sm text-muted">Nenhuma fórmula encontrada.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {tables.map((table) => (
        <FormulaSelectItem
          key={table.id}
          table={table}
          isSelected={selectedId === table.id}
          onSelect={() => onSelect(table.id)}
        />
      ))}
    </div>
  );
}

function ManageActions({
  onSubmit,
  onCancel,
  hasSelection,
}: {
  onSubmit: () => void;
  onCancel: () => void;
  hasSelection: boolean;
}) {
  return (
    <div className="mt-12 flex flex-col gap-3 pb-8">
      <p className="text-center text-sm text-brand-300">Toque na fórmula que deseja editar.</p>
      <button
        type="button"
        onClick={onSubmit}
        disabled={!hasSelection}
        className={cn(
          'w-full rounded-[14px] bg-brand-900 py-3.5 text-base font-bold text-white shadow-lg transition-transform active:scale-[0.98]',
          !hasSelection ? 'opacity-60 cursor-not-allowed' : 'hover:bg-brand-800',
        )}
      >
        Selecionar fórmula
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="text-center text-sm font-semibold text-brand-900 underline hover:opacity-80"
      >
        Cancelar
      </button>
    </div>
  );
}

export function ManagePerformanceTablesPage() {
  const navigate = useNavigate();
  const [tables, setTables] = useState<PerformanceTableSummary[]>([]);
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const fetchTables = useCallback(async (): Promise<PerformanceTableSummary[]> => {
    return performanceTableService.list();
  }, []);

  const { run, isLoading, error } = useAsyncAction(fetchTables);

  useEffect(() => {
    run().then((result) => {
      if (result.ok) setTables(result.data);
    });
  }, [run]);

  const filtered = tables.filter((t) => t.nome.toLowerCase().includes(query.toLowerCase()));

  function handleComplete() {
    if (selectedId) {
      navigate(`${ROUTES.performanceTables}/${selectedId}/editar`);
    }
  }

  return (
    <div className="min-h-dvh bg-surface">
      <ManageHeader />
      <ManageSearch query={query} setQuery={setQuery} />

      <main className="mx-auto mt-6 flex w-full max-w-md flex-col px-4">
        {isLoading && (
          <div className="mt-12 flex justify-center">
            <Spinner className="size-8 text-brand-900" />
          </div>
        )}
        {error && <Alert tone="error">{error.message}</Alert>}

        {!isLoading && (
          <>
            <FormulaSelectList tables={filtered} selectedId={selectedId} onSelect={setSelectedId} />
            <ManageActions
              onSubmit={handleComplete}
              onCancel={() => navigate(-1)}
              hasSelection={Boolean(selectedId)}
            />
          </>
        )}
      </main>
    </div>
  );
}

export default ManagePerformanceTablesPage;
