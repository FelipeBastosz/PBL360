import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { useToast } from '@/hooks/useToast';
import { ROUTES } from '@/routes/paths';
import { sessionService } from '@/services/session.service';
import type { PerformanceTable } from '@/types/performanceTable';
import type { SessionTableIgnored, SessionEvaluationConfig } from '@/types/session';
import { readApplyTarget } from '@/utils/navigationState';

function isDefaultTable(table: PerformanceTable): boolean {
  const flags = table as { isDefault?: boolean; padrao?: boolean };
  return Boolean(flags.isDefault ?? flags.padrao ?? table.origem === 'PADRAO');
}

function isAlreadyApplied(
  table: PerformanceTable,
  config?: SessionEvaluationConfig | null,
): boolean {
  if (!config?.tabela) return false;
  if (config.tabela.id === table.id) return true;
  const sessionName = (config.tabela.nome ?? '').trim().toLowerCase();
  const tableName = (table.nome ?? '').trim().toLowerCase();
  if (isDefaultTable(table)) {
    const baseSessionName = sessionName.split(' — ')[0]?.trim();
    return sessionName === tableName || baseSessionName === tableName;
  }
  return Boolean(sessionName && tableName && sessionName === tableName);
}

function useNavigationHandler() {
  const target = readApplyTarget(useLocation().state);
  const navigate = useNavigate();
  return useCallback(() => {
    if (!target?.sessionId) return;
    const hubPath = ROUTES.sessionHub
      .replace(':roomId', target.roomId ?? '')
      .replace(':problemId', target.problemId ?? '')
      .replace(':sessionId', target.sessionId);
    navigate(hubPath, { replace: true });
  }, [navigate, target]);
}

function useSessionEvaluationConfig(sessionId?: string) {
  const [sessionConfig, setSessionConfig] = useState<SessionEvaluationConfig | null>(null);
  useEffect(() => {
    if (!sessionId) return;
    sessionService
      .getEvaluationConfig(sessionId)
      .then(setSessionConfig)
      .catch(() => undefined);
  }, [sessionId]);
  return sessionConfig;
}

function useApplyTableAction(
  table: PerformanceTable | null,
  target: ReturnType<typeof readApplyTarget>,
  goToHub: () => void,
) {
  const { notify } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [ignoredList, setIgnoredList] = useState<SessionTableIgnored[]>([]);
  const { run, isLoading, error } = useAsyncAction(sessionService.applyTable);

  const handleApply = async (aplicarNasSeguintes: boolean) => {
    if (!target || !table) return;
    const res = await run(target.sessionId, { tabelaId: table.id, aplicarNasSeguintes });
    if (!res.ok) return;
    setIsModalOpen(false);
    notify({ tone: 'success', message: 'Fórmula aplicada com sucesso.' });
    if (res.data?.sessoesIgnoradas?.length > 0) setIgnoredList(res.data.sessoesIgnoradas);
    else goToHub();
  };

  return {
    isModalOpen,
    openModal: () => setIsModalOpen(true),
    closeModal: () => setIsModalOpen(false),
    handleApply,
    isApplying: isLoading,
    applyError: error,
    ignoredList,
  };
}

export function useApplyTableLogic(table: PerformanceTable | null) {
  const target = readApplyTarget(useLocation().state);
  const navigate = useNavigate();
  const goToHub = useNavigationHandler();
  const sessionConfig = useSessionEvaluationConfig(target?.sessionId);
  const action = useApplyTableAction(table, target, goToHub);
  const applied = table ? isAlreadyApplied(table, sessionConfig) : false;

  const editAppliedTable = () => {
    if (!table) return;
    const editId = (applied && sessionConfig?.tabela?.id) || table.id;
    navigate(`${ROUTES.performanceTables}/${editId}/editar`, { state: target });
  };

  return {
    canApply: target !== null,
    isAlreadyApplied: applied,
    isSessionLocked: sessionConfig?.bloqueada ?? false,
    currentTableName: sessionConfig?.tabela?.nome ?? null,
    sessionCriteria: applied ? sessionConfig?.tabela?.criterios : undefined,
    editAppliedTable,
    ...action,
    closeIgnored: goToHub,
  };
}
