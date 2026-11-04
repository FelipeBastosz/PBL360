import { useState, useEffect, useCallback } from 'react';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { performanceTableService } from '@/services/performance-table.service';
import { sessionService } from '@/services/session.service';
import type { CriterionInput, PerformanceTable } from '@/types/performanceTable';
import type { SessionEvaluationConfig, SessionTableEditPermissions } from '@/types/session';
import { isTableApplied } from '../utils/isTableApplied';
import {
  buildPastSessionPermissions,
  mergeTableWithSessionConfig,
} from '../utils/reconcileSessionCriteria';

export type InitialFormulaData = {
  nome: string;
  descricao: string;
  criterios: CriterionInput[];
};

export type ResolvedEditTableData = {
  table: PerformanceTable;
  permissions: SessionTableEditPermissions | null;
  activeSessionId?: string;
};

async function fetchSessionContext(sessionId: string): Promise<{
  config: SessionEvaluationConfig | null;
  permissions: SessionTableEditPermissions | null;
}> {
  const [config, permissions] = await Promise.all([
    sessionService.getEvaluationConfig?.(sessionId)?.catch(() => null) ?? Promise.resolve(null),
    sessionService.getTableEditPermissions?.(sessionId)?.catch(() => null) ?? Promise.resolve(null),
  ]);
  return { config, permissions };
}

async function fetchSessionCopyTable(
  baseTableId: string,
  sessionTableId?: string,
): Promise<PerformanceTable | null> {
  if (!sessionTableId || sessionTableId === baseTableId) return null;
  return performanceTableService.getById(sessionTableId).catch(() => null);
}

export async function resolveEditTableData(
  id: string,
  sessionId?: string,
): Promise<ResolvedEditTableData> {
  const baseTable = await performanceTableService.getById(id);
  if (!sessionId) {
    return { table: baseTable, permissions: buildPastSessionPermissions(baseTable) };
  }
  const { config, permissions } = await fetchSessionContext(sessionId);
  if (config?.tabela && !isTableApplied(baseTable, config)) {
    return { table: baseTable, permissions: buildPastSessionPermissions(baseTable) };
  }
  const sessionTable = await fetchSessionCopyTable(baseTable.id, config?.tabela?.id);
  return {
    table: mergeTableWithSessionConfig(baseTable, sessionTable, config),
    permissions,
    activeSessionId: sessionId,
  };
}

function useFormulaFieldsState() {
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [criterios, setCriterios] = useState<CriterionInput[]>([]);
  const applyTableFields = useCallback((table: PerformanceTable) => {
    setNome(table.nome);
    setDescricao(table.descricao || '');
    setCriterios(table.criterios);
  }, []);
  return { nome, setNome, descricao, setDescricao, criterios, setCriterios, applyTableFields };
}

export function useFetchTableInitialData(id: string, sessionId?: string) {
  const { applyTableFields, ...fields } = useFormulaFieldsState();
  const [permissions, setPermissions] = useState<SessionTableEditPermissions | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string | undefined>(sessionId);
  const [initialData, setInitialData] = useState<InitialFormulaData | null>(null);
  const fetchTable = useCallback(() => resolveEditTableData(id, sessionId), [id, sessionId]);
  const { run, isLoading, error } = useAsyncAction(fetchTable);

  useEffect(() => {
    run().then((res) => {
      if (!res.ok) return;
      const { table, permissions: perms, activeSessionId: resolvedSessionId } = res.data;
      applyTableFields(table);
      setPermissions(perms);
      setActiveSessionId(resolvedSessionId);
      setInitialData({
        nome: table.nome,
        descricao: table.descricao || '',
        criterios: table.criterios,
      });
    });
  }, [run, applyTableFields]);

  return { ...fields, initialData, permissions, activeSessionId, isLoading, error };
}
