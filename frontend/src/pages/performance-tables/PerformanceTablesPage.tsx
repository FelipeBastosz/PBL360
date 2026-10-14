import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';
import { FabMenu } from '@/components/ui/FabMenu';
import { SearchField } from '@/components/ui/SearchField';
import { CARD_GRID_CLASS, PAGE_CONTAINER_CLASS } from '@/components/ui/cardStyles';
import { UserMenuButton } from '@/components/layout/UserMenu';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { useAuth } from '@/hooks/useAuth';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { performanceTableService } from '@/services/performance-table.service';
import { ROUTES } from '@/routes/paths';
import type { PerformanceTableSummary } from '@/types/performanceTable';
import { cn } from '@/utils/cn';
import { readApplyTarget } from '@/utils/navigationState';
import { CreateFormulaModal } from './components/CreateFormulaModal';

function PerformanceTablesHeader() {
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

type SearchProps = { query: string; setQuery: (q: string) => void };
function PerformanceTablesSearch({ query, setQuery }: SearchProps) {
  return (
    <div className={cn(PAGE_CONTAINER_CLASS, 'mt-4')}>
      <SearchField label="Pesquisar fórmula" value={query} onChange={setQuery} />
    </div>
  );
}

function PerformanceTablesEmptyState() {
  return (
    <div className="mt-20 flex flex-col items-center justify-center px-6 text-center">
      <p className="text-base font-semibold text-ink">
        Você ainda não possui fórmulas cadastradas.
      </p>
      <p className="mt-1 text-sm text-muted">
        Toque no <span className="font-bold text-brand-900">+</span> para começar.
      </p>
    </div>
  );
}

function PerformanceTablesFabMenu({ onOpenCreateModal }: { onOpenCreateModal: () => void }) {
  return (
    <FabMenu
      label="Ações de fórmula"
      actions={[
        { label: 'Editar uma fórmula', to: ROUTES.managePerformanceTables },
        { label: 'Criar nova fórmula', onClick: onOpenCreateModal },
      ]}
    />
  );
}

type CardProps = { table: PerformanceTableSummary };
function PerformanceTableCard({ table }: CardProps) {
  const { state } = useLocation();

  return (
    <Link
      to={`${ROUTES.performanceTables}/${table.id}`}
      state={readApplyTarget(state)}
      className="flex flex-col overflow-hidden rounded-xl border border-black/5 bg-white shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="h-1.5 w-full bg-brand-900" />
      <div className="flex flex-col gap-3 p-4">
        <div>
          <h3 className="line-clamp-2 text-base font-bold text-brand-900">{table.nome}</h3>
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

type ListProps = { isLoading: boolean; tables: PerformanceTableSummary[]; hasFilter: boolean };
function PerformanceTablesList({ isLoading, tables, hasFilter }: ListProps) {
  if (isLoading) {
    return (
      <div className="mt-10 flex justify-center">
        <Spinner className="size-8 text-brand-900" />
      </div>
    );
  }

  if (tables.length === 0) {
    return hasFilter ? (
      <p className="mt-10 text-center text-sm text-muted">Nenhuma fórmula encontrada.</p>
    ) : (
      <PerformanceTablesEmptyState />
    );
  }

  return (
    <div className={cn(CARD_GRID_CLASS, 'mt-4')}>
      {tables.map((table) => (
        <PerformanceTableCard key={table.id} table={table} />
      ))}
    </div>
  );
}

export function PerformanceTablesPage() {
  const navigate = useNavigate();
  const [tables, setTables] = useState<PerformanceTableSummary[]>([]);
  const [query, setQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const fetchTables = useCallback(async (): Promise<PerformanceTableSummary[]> => {
    return performanceTableService.list();
  }, []);

  const { run, isLoading, error } = useAsyncAction(fetchTables);

  useEffect(() => {
    run().then((result) => {
      if (result.ok) setTables(result.data);
    });
  }, [run]);

  const filteredTables = tables.filter((t) => t.nome.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="min-h-dvh bg-surface pb-24">
      <PerformanceTablesHeader />
      <PerformanceTablesSearch query={query} setQuery={setQuery} />

      <main className={cn(PAGE_CONTAINER_CLASS, 'mt-6')}>
        {tables.length > 0 && (
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted">
            Minhas fórmulas · {filteredTables.length}
          </h2>
        )}
        {error && (
          <Alert tone="error" className="mt-4">
            {error.message}
          </Alert>
        )}
        <PerformanceTablesList
          isLoading={isLoading}
          tables={filteredTables}
          hasFilter={query.length > 0}
        />
      </main>

      <PerformanceTablesFabMenu onOpenCreateModal={() => setIsCreateModalOpen(true)} />

      <CreateFormulaModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={(data) => {
          setIsCreateModalOpen(false);
          navigate(ROUTES.createPerformanceTable, { state: data });
        }}
      />
    </div>
  );
}

export default PerformanceTablesPage;
