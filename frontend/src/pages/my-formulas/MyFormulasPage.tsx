import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchField } from '@/components/ui/SearchField';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { CARD_GRID_CLASS, PAGE_CONTAINER_CLASS } from '@/components/ui/cardStyles';
import { useAuth } from '@/hooks/useAuth';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { performanceTableService } from '@/services/performance-table.service';
import { ROUTES } from '@/routes/paths';
import type { PerformanceTableSummary } from '@/types/performanceTable';
import { cn } from '@/utils/cn';
import { CreateFormulaModal } from '@/pages/performance-tables/components/CreateFormulaModal';
import { MyFormulasHeader } from './components/MyFormulasHeader';
import { MyFormulaCard } from './components/MyFormulaCard';
import { MyFormulasFabMenu } from './components/MyFormulasFabMenu';

function filterTeacherFormulas(tables: PerformanceTableSummary[], userId?: string) {
  return tables.filter(
    (t) =>
      !t.isDefault &&
      t.origem !== 'PADRAO' &&
      t.origem !== 'TURMA' &&
      (!t.professorId || (userId && t.professorId === userId)) &&
      (!t.autor?.id || (userId && t.autor.id === userId)),
  );
}

function useMyFormulasData() {
  const { user } = useAuth();
  const userId = user?.id;
  const userName = user?.nome;
  const [tables, setTables] = useState<PerformanceTableSummary[]>([]);

  const fetcher = useCallback(() => performanceTableService.list(), []);
  const { run, isLoading, error } = useAsyncAction(fetcher);

  useEffect(() => {
    run().then((res) => {
      if (res.ok) setTables(res.data);
    });
  }, [run]);

  const teacherFormulas = useMemo(() => {
    return filterTeacherFormulas(tables, userId).map((t) => ({
      ...t,
      origem: 'PESSOAL' as const,
      autor: t.autor ?? { id: userId ?? null, nome: userName ?? 'Professor' },
    }));
  }, [tables, userId, userName]);

  return { teacherFormulas, isLoading, error };
}

function MyFormulasList({
  isLoading,
  error,
  filtered,
}: {
  isLoading: boolean;
  error: Error | null;
  filtered: PerformanceTableSummary[];
}) {
  if (error) return <Alert tone="error">{error.message}</Alert>;
  if (isLoading) {
    return (
      <div className="mt-10 flex justify-center">
        <Spinner className="size-8 text-brand-accent" />
      </div>
    );
  }
  if (filtered.length === 0) {
    return <p className="mt-10 text-center text-sm text-muted">Nenhuma fórmula encontrada.</p>;
  }
  return (
    <section className="mt-6 flex flex-col gap-3">
      <h2 className="text-xs font-bold uppercase tracking-widest text-muted">
        Minhas fórmulas · {filtered.length}
      </h2>
      <div className={CARD_GRID_CLASS}>
        {filtered.map((table) => (
          <MyFormulaCard key={table.id} table={table} />
        ))}
      </div>
    </section>
  );
}

export function MyFormulasPage() {
  const navigate = useNavigate();
  const { teacherFormulas, isLoading, error } = useMyFormulasData();
  const [query, setQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const filtered = useMemo(
    () => teacherFormulas.filter((t) => t.nome.toLowerCase().includes(query.toLowerCase())),
    [teacherFormulas, query],
  );

  return (
    <div className="min-h-dvh bg-surface pb-24">
      <MyFormulasHeader />
      <div className={cn(PAGE_CONTAINER_CLASS, 'mt-4')}>
        <SearchField label="Pesquisar fórmula" value={query} onChange={setQuery} />
      </div>

      <main className={cn(PAGE_CONTAINER_CLASS, 'mt-4')}>
        <MyFormulasList isLoading={isLoading} error={error} filtered={filtered} />
      </main>

      <MyFormulasFabMenu onOpenCreateModal={() => setIsCreateOpen(true)} />

      <CreateFormulaModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={(data) => {
          setIsCreateOpen(false);
          navigate(ROUTES.createMyFormula, { state: data });
        }}
      />
    </div>
  );
}

export default MyFormulasPage;
