import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { useToast } from '@/hooks/useToast';
import { ROUTES } from '@/routes/paths';
import { sessionService } from '@/services/session.service';
import type { PerformanceTable } from '@/types/performanceTable';
import type { SessionTableIgnored, SessionEvaluationConfig } from '@/types/session';
import { readApplyTarget } from '@/utils/navigationState';

function isAlreadyApplied(
  table: PerformanceTable,
  config?: SessionEvaluationConfig | null,
): boolean {
  if (!config?.tabela) return false;
  if (config.tabela.id === table.id) return true;
  const isTableDefault = Boolean(
    (table as { isDefault?: boolean; padrao?: boolean }).isDefault ??
    (table as { isDefault?: boolean; padrao?: boolean }).padrao ??
    table.origem === 'PADRAO',
  );
  if (isTableDefault) {
    const sessionName = (config.tabela.nome ?? '').trim().toLowerCase();
    const tableName = (table.nome ?? '').trim().toLowerCase();
    const baseSessionName = sessionName.split(' — ')[0]?.trim();
    return sessionName === tableName || baseSessionName === tableName;
  }
  return false;
}

function useNavigationHandler() {
  const target = readApplyTarget(useLocation().state);
  const navigate = useNavigate();
  return useCallback(() => {
    if (!target?.sessionId) return;
    navigate(
      ROUTES.sessionHub
        .replace(':roomId', target.roomId ?? '')
        .replace(':problemId', target.problemId ?? '')
        .replace(':sessionId', target.sessionId),
      { replace: true },
    );
  }, [navigate, target]);
}

export function useApplyTableLogic(table: PerformanceTable | null) {
  const target = readApplyTarget(useLocation().state);
  const { notify } = useToast();
  const goToHub = useNavigationHandler();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [ignoredList, setIgnoredList] = useState<SessionTableIgnored[]>([]);
  const [sessionConfig, setSessionConfig] = useState<SessionEvaluationConfig | null>(null);
  const { run, isLoading, error } = useAsyncAction(sessionService.applyTable);

  useEffect(() => {
    if (!target?.sessionId) return;
    sessionService
      .getEvaluationConfig(target.sessionId)
      .then(setSessionConfig)
      .catch(() => undefined);
  }, [target?.sessionId]);

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
    canApply: target !== null,
    isAlreadyApplied: table ? isAlreadyApplied(table, sessionConfig) : false,
    isSessionLocked: sessionConfig?.bloqueada ?? false,
    currentTableName: sessionConfig?.tabela?.nome ?? null,
    isModalOpen,
    openModal: () => setIsModalOpen(true),
    closeModal: () => setIsModalOpen(false),
    handleApply,
    isApplying: isLoading,
    applyError: error,
    ignoredList,
    closeIgnored: goToHub,
  };
}
