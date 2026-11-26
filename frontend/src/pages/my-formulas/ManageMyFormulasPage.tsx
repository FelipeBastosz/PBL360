import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { SearchField } from '@/components/ui/SearchField';
import { PAGE_CONTAINER_CLASS } from '@/components/ui/cardStyles';
import { useAuth } from '@/hooks/useAuth';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { performanceTableService } from '@/services/performance-table.service';
import { ROUTES } from '@/routes/paths';
import type { PerformanceTableSummary } from '@/types/performanceTable';
import { cn } from '@/utils/cn';
import { MyFormulasHeader } from './components/MyFormulasHeader';

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
          ? 'border-brand-accent bg-brand-soft text-brand-accent ring-2 ring-brand-accent'
          : 'border-border-subtle bg-elevated text-brand-accent hover:bg-subtle',
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
          'w-full rounded-[14px] bg-brand-primary py-3.5 text-base font-bold text-white shadow-lg transition-transform active:scale-[0.98]',
          !hasSelection ? 'opacity-60 cursor-not-allowed' : 'hover:bg-brand-primary-hover',
        )}
      >
        Selecionar fórmula
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="text-center text-sm font-semibold text-brand-accent underline hover:opacity-80"
      >
        Cancelar
      </button>
    </div>
  );
}

function useManageMyFormulasData() {
  const { user } = useAuth();
  const userId = user?.id;
  const [tables, setTables] = useState<PerformanceTableSummary[]>([]);
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const fetchTables = useCallback(() => performanceTableService.list(), []);
  const { run, isLoading, error } = useAsyncAction(fetchTables);

  useEffect(() => {
    run().then((result) => {
      if (result.ok) setTables(result.data);
    });
  }, [run]);

  const teacherFormulas = useMemo(() => {
    return tables.filter(
      (t) =>
        !t.isDefault &&
        t.origem !== 'PADRAO' &&
        t.origem !== 'TURMA' &&
        (!t.professorId || (userId && t.professorId === userId)) &&
        (!t.autor?.id || (userId && t.autor.id === userId)),
    );
  }, [tables, userId]);

  const filtered = useMemo(
    () => teacherFormulas.filter((t) => t.nome.toLowerCase().includes(query.toLowerCase())),
    [teacherFormulas, query],
  );

  return {
    query,
    setQuery,
    selectedId,
    setSelectedId,
    filtered,
    isLoading,
    error,
  };
}

export function ManageMyFormulasPage() {
  const navigate = useNavigate();
  const { query, setQuery, selectedId, setSelectedId, filtered, isLoading, error } =
    useManageMyFormulasData();

  function handleComplete() {
    if (selectedId) {
      navigate(`${ROUTES.myFormulas}/${selectedId}/editar`);
    }
  }

  return (
    <div className="min-h-dvh bg-surface">
      <MyFormulasHeader />
      <div className={cn(PAGE_CONTAINER_CLASS, 'mt-4')}>
        <SearchField label="Pesquisar fórmula" value={query} onChange={setQuery} />
      </div>

      <main className="mx-auto mt-6 flex w-full max-w-md flex-col px-4">
        {isLoading && (
          <div className="mt-12 flex justify-center">
            <Spinner className="size-8 text-brand-accent" />
          </div>
        )}
        {error && <Alert tone="error">{error.message}</Alert>}

        {!isLoading && (
          <>
            <FormulaSelectList tables={filtered} selectedId={selectedId} onSelect={setSelectedId} />
            <ManageActions
              onSubmit={handleComplete}
              onCancel={() => navigate(ROUTES.myFormulas)}
              hasSelection={Boolean(selectedId)}
            />
          </>
        )}
      </main>
    </div>
  );
}

export default ManageMyFormulasPage;
