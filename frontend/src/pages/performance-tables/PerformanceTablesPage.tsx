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
  const target = readApplyTarget(useLocation().state);
  const data = usePerformanceTablesData(target?.roomId, target?.sessionId);
  const deletion = useTableDeletion(data.reload);
  const modals = usePageModals();

  const userName =
    (user as { nome?: string; name?: string })?.nome ??
    (user as { nome?: string; name?: string })?.name;
  const externalAppliedTable = useAppliedSessionTable(
    data.sessionConfig,
    data.tables,
    target?.roomId,
    user,
  );

  const viewModel = usePerformanceTablesViewModel({
    tables: data.tables,
    sessionConfig: data.sessionConfig,
    externalAppliedTable,
    query: modals.query,
    isRoomContext: Boolean(target?.roomId),
    currentUserId: user?.id,
    userName,
  });

  return { navigate, user, target, data, deletion, modals, viewModel };
}

export function PerformanceTablesPage() {
  const { navigate, user, target, data, deletion, modals, viewModel } = usePageDependencies();

  return (
    <div className="min-h-dvh bg-surface pb-24">
      <PerformanceTablesHeader />
      <div className={cn(PAGE_CONTAINER_CLASS, 'mt-4')}>
        <SearchField label="Pesquisar fórmula" value={modals.query} onChange={modals.setQuery} />
      </div>

      <PerformanceTablesContent
        isLoading={data.isLoading}
        error={data.error}
        hasTargetSession={Boolean(target?.sessionId)}
        sessionConfig={data.sessionConfig}
        filtered={viewModel.filtered}
        sections={viewModel.sections}
        currentUserId={user?.id}
        target={target}
        checkApplied={viewModel.checkApplied}
        onDeleteTable={deletion.setTableToDelete}
      />

      <PageModalsAndActions
        modals={modals}
        deletion={deletion}
        target={target}
        navigate={navigate}
      />
    </div>
  );
}

export default PerformanceTablesPage;
