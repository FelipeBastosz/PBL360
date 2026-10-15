import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { PlusIcon, ChevronLeftIcon } from '@heroicons/react/24/outline';
import { SearchField } from '@/components/ui/SearchField';
import { CARD_GRID_CLASS, PAGE_CONTAINER_CLASS } from '@/components/ui/cardStyles';
import { UserMenuButton } from '@/components/layout/UserMenu';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { useAuth } from '@/hooks/useAuth';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { performanceTableService } from '@/services/performance-table.service';
import { sessionService } from '@/services/session.service';
import { ROUTES } from '@/routes/paths';
import type { PerformanceTableSummary } from '@/types/performanceTable';
import type { SessionEvaluationConfig } from '@/types/session';
import { cn } from '@/utils/cn';
import { readApplyTarget, type ApplyTarget } from '@/utils/navigationState';
import { CreateFormulaModal } from './components/CreateFormulaModal';
import { PerformanceTableCard } from './components/PerformanceTableCard';

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

function checkIsApplied(
  table: PerformanceTableSummary,
  config: SessionEvaluationConfig | null,
  sessionId?: string,
): boolean {
  try {
    if (sessionId) {
      const appliedId = sessionStorage.getItem(`pbl360_applied_table_${sessionId}`);
      if (appliedId) return appliedId === table.id;
    }
  } catch {
    // ignore
  }
  if (!config?.tabela) return false;
  if (config.tabela.id === table.id) return true;
  const configName = (config.tabela.nome ?? '').trim().toLowerCase();
  const tableName = (table.nome ?? '').trim().toLowerCase();
  return configName !== '' && configName === tableName;
}

function PerformanceTablesList({
  isLoading,
  tables,
  hasFilter,
  sessionConfig,
  target,
}: {
  isLoading: boolean;
  tables: PerformanceTableSummary[];
  hasFilter: boolean;
  sessionConfig: SessionEvaluationConfig | null;
  target: ApplyTarget | null;
}) {
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

  return (
    <div className={cn(CARD_GRID_CLASS, 'mt-4')}>
      {tables.map((table) => (
        <PerformanceTableCard
          key={table.id}
          table={table}
          isApplied={checkIsApplied(table, sessionConfig, target?.sessionId)}
          target={target}
        />
      ))}
    </div>
  );
}

function PerformanceTablesFabMenu({
  onOpenCreateModal,
  target,
}: {
  onOpenCreateModal: () => void;
  target: ApplyTarget | null;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="fixed bottom-6 right-6 flex flex-col items-end gap-3">
      {isOpen && (
        <div className="flex animate-fade-up flex-col items-end gap-2">
          <button
            onClick={() => {
              setIsOpen(false);
              navigate(ROUTES.managePerformanceTables, { state: target });
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

function usePerformanceTablesData(targetSessionId?: string) {
  const [tables, setTables] = useState<PerformanceTableSummary[]>([]);
  const [sessionConfig, setSessionConfig] = useState<SessionEvaluationConfig | null>(null);
  const { run, isLoading, error } = useAsyncAction(
    useCallback(() => performanceTableService.list(), []),
  );

  useEffect(() => {
    run().then((res) => res.ok && setTables(res.data));
    if (targetSessionId && typeof sessionService.getEvaluationConfig === 'function') {
      sessionService
        .getEvaluationConfig(targetSessionId)
        .then(setSessionConfig)
        .catch(() => undefined);
    }
  }, [run, targetSessionId]);

  useEffect(() => {
    if (!targetSessionId || !sessionConfig?.tabela || tables.length === 0) return;
    const key = `pbl360_applied_table_${targetSessionId}`;
    try {
      if (!sessionStorage.getItem(key)) {
        const match = tables.find((t) => checkIsApplied(t, sessionConfig));
        if (match) sessionStorage.setItem(key, match.id);
      }
    } catch {
      // ignore
    }
  }, [tables, sessionConfig, targetSessionId]);

  return { tables, sessionConfig, isLoading, error };
}

export function PerformanceTablesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const target = readApplyTarget(location.state);
  const { tables, sessionConfig, isLoading, error } = usePerformanceTablesData(target?.sessionId);
  const [query, setQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const filtered = tables.filter((t) => t.nome.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="min-h-dvh bg-surface pb-24">
      <PerformanceTablesHeader />
      <div className={cn(PAGE_CONTAINER_CLASS, 'mt-4')}>
        <SearchField label="Pesquisar fórmula" value={query} onChange={setQuery} />
      </div>

      <main className={cn(PAGE_CONTAINER_CLASS, 'mt-6')}>
        {tables.length > 0 && (
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted">
            Minhas fórmulas · {filtered.length}
          </h2>
        )}
        {error && (
          <Alert tone="error" className="mt-4">
            {error.message}
          </Alert>
        )}
        <PerformanceTablesList
          isLoading={isLoading}
          tables={filtered}
          hasFilter={query.length > 0}
          sessionConfig={sessionConfig}
          target={target}
        />
      </main>

      <PerformanceTablesFabMenu
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
        target={target}
      />

      <CreateFormulaModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={(data) => {
          setIsCreateModalOpen(false);
          navigate(ROUTES.createPerformanceTable, { state: { ...data, target } });
        }}
      />
    </div>
  );
}

export default PerformanceTablesPage;
