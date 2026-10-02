import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MagnifyingGlassIcon, PlusIcon, ChevronLeftIcon } from '@heroicons/react/24/outline';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { useAuth } from '@/hooks/useAuth';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import type { PerformanceTable } from '@/types/performanceTable';
import { cn } from '@/utils/cn';

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

function PerformanceTablesFabMenu() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 flex flex-col items-end gap-3">
      {isOpen && (
        <div className="flex animate-fade-up flex-col items-end gap-2">
          <button className="rounded-full border border-brand-900 bg-white px-5 py-2 text-sm font-semibold text-brand-900 shadow-sm hover:bg-brand-50">
            Ordenar fórmulas
          </button>
          <button className="rounded-full border border-brand-900 bg-white px-5 py-2 text-sm font-semibold text-brand-900 shadow-sm hover:bg-brand-50">
            Editar uma fórmula
          </button>
          <button className="rounded-full border border-brand-900 bg-white px-5 py-2 text-sm font-semibold text-brand-900 shadow-sm hover:bg-brand-50">
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

type ListProps = { isLoading: boolean; tables: PerformanceTable[]; hasFilter: boolean };
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
    <div className="mt-4 flex flex-col gap-4">{/* Cards serão inseridos aqui futuramente */}</div>
  );
}

export function PerformanceTablesPage() {
  const [tables, setTables] = useState<PerformanceTable[]>([]);
  const [query, setQuery] = useState('');

  // Fetch mockado devolvendo array vazio para exibir o Empty State inicialmente, conforme a task
  const fetchTables = useCallback(async (): Promise<PerformanceTable[]> => {
    return [];
  }, []);

  const { run, isLoading, error } = useAsyncAction(fetchTables);

  useEffect(() => {
    run().then((result) => {
      if (result.ok) setTables(result.data);
    });
  }, [run]);

  const filteredTables = tables.filter((t) => t.nome?.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="min-h-dvh bg-surface pb-24">
      <PerformanceTablesHeader />
      <PerformanceTablesSearch query={query} setQuery={setQuery} />

      <main className="mx-auto mt-6 w-full max-w-md px-4">
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

      <PerformanceTablesFabMenu />
    </div>
  );
}
