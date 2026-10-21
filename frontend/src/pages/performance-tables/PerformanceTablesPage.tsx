import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { SearchField } from '@/components/ui/SearchField';
import { PAGE_CONTAINER_CLASS } from '@/components/ui/cardStyles';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { performanceTableService } from '@/services/performance-table.service';
import { sessionService } from '@/services/session.service';
import { ROUTES } from '@/routes/paths';
import type { PerformanceTableSummary } from '@/types/performanceTable';
import type { SessionEvaluationConfig } from '@/types/session';
import { cn } from '@/utils/cn';
import { readApplyTarget } from '@/utils/navigationState';
import { CreateFormulaModal } from './components/CreateFormulaModal';
import { DeletePerformanceTableModal } from './components/DeletePerformanceTableModal';
import { PerformanceTableSection } from './components/PerformanceTableSection';
import {
  PerformanceTablesHeader,
  PerformanceTablesFabMenu,
} from './components/PerformanceTablesLayout';

function usePerformanceTablesData(roomId?: string, sessionId?: string) {
  const [tables, setTables] = useState<PerformanceTableSummary[]>([]);
  const [sessionConfig, setSessionConfig] = useState<SessionEvaluationConfig | null>(null);

  const fetcher = useCallback(() => {
    return roomId ? performanceTableService.listByRoom(roomId) : performanceTableService.list();
  }, [roomId]);

  const { run, isLoading, error } = useAsyncAction(fetcher);

  useEffect(() => {
    run().then((res) => res.ok && setTables(res.data));
    if (sessionId && typeof sessionService.getEvaluationConfig === 'function') {
      sessionService
        .getEvaluationConfig(sessionId)
        .then(setSessionConfig)
        .catch(() => undefined);
    }
  }, [run, sessionId]);

  return { tables, setTables, sessionConfig, isLoading, error, reload: run };
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

export function PerformanceTablesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const target = readApplyTarget(useLocation().state);
  const { tables, sessionConfig, isLoading, error, reload } = usePerformanceTablesData(
    target?.roomId,
    target?.sessionId,
  );
  const deletion = useTableDeletion(reload);
  const [query, setQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const filtered = useMemo(
    () => tables.filter((t) => t.nome.toLowerCase().includes(query.toLowerCase())),
    [tables, query],
  );

  const isRoomContext = Boolean(target?.roomId);
  const sections = useMemo(() => {
    if (!isRoomContext) return null;
    return {
      padrao: filtered.filter((t) => t.origem === 'PADRAO'),
      turma: filtered.filter((t) => t.origem === 'TURMA'),
      minhas: filtered.filter((t) => t.origem === 'PESSOAL'),
    };
  }, [filtered, isRoomContext]);

  const checkApplied = useCallback(
    (t: PerformanceTableSummary) => {
      if (!sessionConfig?.tabela) return false;
      return sessionConfig.tabela.id === t.id || sessionConfig.tabela.nome === t.nome;
    },
    [sessionConfig],
  );

  return (
    <div className="min-h-dvh bg-surface pb-24">
      <PerformanceTablesHeader />
      <div className={cn(PAGE_CONTAINER_CLASS, 'mt-4')}>
        <SearchField label="Pesquisar fórmula" value={query} onChange={setQuery} />
      </div>

      <main className={cn(PAGE_CONTAINER_CLASS, 'mt-4')}>
        {error && <Alert tone="error">{error.message}</Alert>}
        {isLoading && (
          <div className="mt-10 flex justify-center">
            <Spinner className="size-8 text-brand-900" />
          </div>
        )}

        {!isLoading && filtered.length === 0 && (
          <p className="mt-10 text-center text-sm text-muted">Nenhuma fórmula encontrada.</p>
        )}

        {!isLoading && sections && (
          <>
            <PerformanceTableSection
              title="Padrão do sistema"
              tables={sections.padrao}
              currentUserId={user?.id}
              target={target}
              checkIsApplied={checkApplied}
              onOpenDelete={deletion.setTableToDelete}
            />
            <PerformanceTableSection
              title="Da turma"
              tables={sections.turma}
              currentUserId={user?.id}
              target={target}
              checkIsApplied={checkApplied}
              onOpenDelete={deletion.setTableToDelete}
            />
            <PerformanceTableSection
              title="Minhas"
              tables={sections.minhas}
              currentUserId={user?.id}
              target={target}
              checkIsApplied={checkApplied}
              onOpenDelete={deletion.setTableToDelete}
            />
          </>
        )}

        {!isLoading && !sections && filtered.length > 0 && (
          <PerformanceTableSection
            title="Minhas fórmulas"
            tables={filtered}
            currentUserId={user?.id}
            target={target}
            checkIsApplied={checkApplied}
            onOpenDelete={deletion.setTableToDelete}
          />
        )}
      </main>

      <PerformanceTablesFabMenu onOpenCreateModal={() => setIsCreateOpen(true)} target={target} />

      <CreateFormulaModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={(data) => {
          setIsCreateOpen(false);
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
    </div>
  );
}

export default PerformanceTablesPage;
