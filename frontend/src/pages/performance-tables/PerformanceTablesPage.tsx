import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { SearchField } from '@/components/ui/SearchField';
import { PAGE_CONTAINER_CLASS } from '@/components/ui/cardStyles';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { performanceTableService } from '@/services/performance-table.service';
import { sessionService } from '@/services/session.service';
import { ROUTES } from '@/routes/paths';
import type { PerformanceTableSummary } from '@/types/performanceTable';
import type { SessionEvaluationConfig } from '@/types/session';
import { cn } from '@/utils/cn';
import { readApplyTarget, type ApplyTarget } from '@/utils/navigationState';
import { CreateFormulaModal } from './components/CreateFormulaModal';
import { DeletePerformanceTableModal } from './components/DeletePerformanceTableModal';
import {
  PerformanceTablesHeader,
  PerformanceTablesFabMenu,
} from './components/PerformanceTablesLayout';
import { PerformanceTablesContent } from './components/PerformanceTablesContent';
import { useAppliedSessionTable } from './hooks/useAppliedSessionTable';
import { usePerformanceTablesViewModel } from './hooks/usePerformanceTablesViewModel';

function usePerformanceTablesData(roomId?: string, sessionId?: string) {
  const [tables, setTables] = useState<PerformanceTableSummary[]>([]);
  const [sessionConfig, setSessionConfig] = useState<SessionEvaluationConfig | null>(null);
  const fetcher = useCallback(
    () => (roomId ? performanceTableService.listByRoom(roomId) : performanceTableService.list()),
    [roomId],
  );
  const { run, isLoading, error } = useAsyncAction(fetcher);

  useEffect(() => {
    run().then((res) => res.ok && setTables(res.data));
    if (sessionId) {
      sessionService
        .getEvaluationConfig(sessionId)
        .then(setSessionConfig)
        .catch(() => undefined);
    }
  }, [run, sessionId]);

  return { tables, sessionConfig, isLoading, error, reload: run };
}

function useTableDeletion(onDeleted: () => void) {
  const { notify } = useToast();
  const [tableToDelete, setTableToDelete] = useState<PerformanceTableSummary | null>(null);
  const { run, isLoading } = useAsyncAction(performanceTableService.remove);

  async function handleConfirmDelete() {
    if (!tableToDelete) return;
    const res = await run(tableToDelete.id);
    if (res.ok) {
      notify({ tone: 'success', message: 'Fórmula excluída com sucesso.' });
      setTableToDelete(null);
      onDeleted();
    }
  }

  return { tableToDelete, setTableToDelete, isLoading, handleConfirmDelete };
}

function usePageModals() {
  const [query, setQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  return { query, setQuery, isCreateOpen, setIsCreateOpen };
}

type PageModalsProps = {
  modals: ReturnType<typeof usePageModals>;
  deletion: ReturnType<typeof useTableDeletion>;
  target: ApplyTarget | null;
  navigate: (to: string, options?: { state?: unknown; replace?: boolean }) => void;
};

function PageModalsAndActions({ modals, deletion, target, navigate }: PageModalsProps) {
  return (
    <>
      <PerformanceTablesFabMenu
        onOpenCreateModal={() => modals.setIsCreateOpen(true)}
        target={target}
      />
      <CreateFormulaModal
        isOpen={modals.isCreateOpen}
        onClose={() => modals.setIsCreateOpen(false)}
        onSubmit={(data) => {
          modals.setIsCreateOpen(false);
          navigate(ROUTES.createPerformanceTable, { state: { ...data, target } });
        }}
      />
      <DeletePerformanceTableModal
        isOpen={Boolean(deletion.tableToDelete)}
        formulaTitle={deletion.tableToDelete?.nome ?? ''}
        isLoading={deletion.isLoading}
        onConfirm={deletion.handleConfirmDelete}
        onCancel={() => deletion.setTableToDelete(null)}
      />
    </>
  );
}

function usePageDependencies() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const locationState = useLocation().state as Record<string, unknown> | null;
  const target = readApplyTarget(locationState);

  const roomId =
    target?.roomId ||
    (typeof locationState?.roomId === 'string' ? locationState.roomId : undefined);
  const sessionId = target?.sessionId;
  const activeTarget = target || (roomId ? { roomId, sessionId: '', problemId: '' } : null);

  const data = usePerformanceTablesData(roomId, sessionId);
  const deletion = useTableDeletion(data.reload);
  const modals = usePageModals();

  const userName =
    (user as { nome?: string; name?: string })?.nome ??
    (user as { nome?: string; name?: string })?.name;
  const externalAppliedTable = useAppliedSessionTable(
    data.sessionConfig,
    data.tables,
    roomId,
    user,
  );

  const viewModel = usePerformanceTablesViewModel({
    tables: data.tables,
    sessionConfig: data.sessionConfig,
    externalAppliedTable,
    query: modals.query,
    isRoomContext: Boolean(roomId),
    currentUserId: user?.id,
    userName,
  });

  return { navigate, user, target: activeTarget, data, deletion, modals, viewModel, sessionId };
}

export function PerformanceTablesPage({ showHeader = true }: { showHeader?: boolean } = {}) {
  const deps = usePageDependencies();

  return (
    <div className="min-h-dvh bg-surface pb-24">
      {showHeader && <PerformanceTablesHeader />}
      <div className={cn(PAGE_CONTAINER_CLASS, 'mt-4')}>
        <SearchField
          label="Pesquisar fórmula"
          value={deps.modals.query}
          onChange={deps.modals.setQuery}
        />
      </div>

      <PerformanceTablesContent
        isLoading={deps.data.isLoading}
        error={deps.data.error}
        hasTargetSession={Boolean(deps.sessionId)}
        sessionConfig={deps.data.sessionConfig}
        filtered={deps.viewModel.filtered}
        sections={deps.viewModel.sections}
        currentUserId={deps.user?.id}
        target={deps.target}
        checkApplied={deps.viewModel.checkApplied}
        onDeleteTable={deps.deletion.setTableToDelete}
      />

      <PageModalsAndActions
        modals={deps.modals}
        deletion={deps.deletion}
        target={deps.target}
        navigate={deps.navigate}
      />
    </div>
  );
}

export default PerformanceTablesPage;
