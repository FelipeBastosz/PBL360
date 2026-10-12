import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { PlusIcon, ChevronLeftIcon } from '@heroicons/react/24/outline';
import { SearchField } from '@/components/ui/SearchField';
import { CARD_GRID_CLASS, PAGE_CONTAINER_CLASS } from '@/components/ui/cardStyles';
import { UserAvatar } from '@/components/ui/UserAvatar';
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
    <header className="flex h-16 shrink-0 items-center justify-between bg-brand-900 px-4 text-white">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} aria-label="Voltar" className="p-1">
          <ChevronLeftIcon className="size-6" strokeWidth={2} />
        </button>
        <h1 className="text-lg font-bold">Fórmulas</h1>
      </div>
      <UserAvatar user={user} />
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
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="fixed bottom-6 right-6 flex flex-col items-end gap-3">
      {isOpen && (
        <div className="flex animate-fade-up flex-col items-end gap-2">
          <button
            onClick={() => {
              setIsOpen(false);
              navigate(ROUTES.managePerformanceTables);
            }}
            className="rounded-full border border-brand-900 bg-white px-5 py-2 text-sm font-semibold text-brand-900 shadow-sm hover:bg-brand-50"
          >
            Editar uma fórmula
          </button>
          <button
            onClick={() => {
              setIsOpen(false);
              onOpenCreateModal();
            }}
            className="rounded-full border border-brand-900 bg-white px-5 py-2 text-sm font-semibold text-brand-900 shadow-sm hover:bg-brand-50"
          >
            Criar nova fórmula
          </button>
        </div>
      )}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex size-14 items-center justify-center rounded-full bg-brand-900 text-white shadow-lg transition-transform',
          isOpen ? 'rotate-45 bg-danger' : '',
        )}
        aria-label="Ações de fórmula"
      >
        <PlusIcon className="size-6" strokeWidth={2.5} />
      </button>
    </div>
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
