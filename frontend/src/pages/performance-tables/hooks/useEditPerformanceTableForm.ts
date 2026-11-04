import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/useToast';
import { performanceTableService } from '@/services/performance-table.service';
import { sessionService } from '@/services/session.service';
import { ROUTES } from '@/routes/paths';
import { readApplyTarget } from '@/utils/navigationState';
import type { CriterionInput } from '@/types/performanceTable';
import { useFetchTableInitialData, type InitialFormulaData } from './useFetchEditTableData';

function validateEditFormula(nome: string, count: number, totalWeight: number) {
  if (!nome.trim()) return 'O título da fórmula é obrigatório.';
  if (count === 0) return 'A tabela deve possuir ao menos um critério.';
  if (totalWeight !== 10) return 'A soma dos pesos dos critérios deve ser exatamente 10.';
  return null;
}

function checkIsDirty(current: InitialFormulaData, initial: InitialFormulaData | null) {
  if (!initial) return false;
  return (
    current.nome !== initial.nome ||
    current.descricao !== initial.descricao ||
    JSON.stringify(current.criterios) !== JSON.stringify(initial.criterios)
  );
}

async function submitUpdate(
  id: string,
  payload: { nome: string; descricao: string | null; criterios: CriterionInput[] },
  notify: (t: { tone: 'success'; message: string }) => void,
  navigate: (to: string, opts?: { replace?: boolean; state?: unknown }) => void,
) {
  const cleanPayload = {
    nome: payload.nome,
    descricao: payload.descricao,
    criterios: payload.criterios.map((c) => ({
      ...(c.id ? { id: c.id } : {}),
      nome: c.nome,
      descricao: c.descricao || null,
      ordem: c.ordem,
      peso: c.peso,
    })),
  };
  await performanceTableService.update(id, cleanPayload);
  notify({ tone: 'success', message: 'Fórmula atualizada com sucesso.' });
  navigate(ROUTES.performanceTables, { replace: true, state: readApplyTarget(null) });
}

async function submitSessionUpdate(
  sessionId: string,
  scope: 'SESSAO' | 'TODAS',
  payload: { nome: string; criterios: CriterionInput[] },
  canEditCriteria: boolean,
  notify: (t: { tone: 'success'; message: string }) => void,
  navigate: (to: string, opts?: { replace?: boolean; state?: unknown }) => void,
  targetState: unknown,
) {
  const criteriaPayload = payload.criterios.map((c) => ({
    ...(c.id ? { id: c.id } : {}),
    ...(canEditCriteria ? { nome: c.nome } : {}),
    peso: c.peso,
  }));
  const res = await sessionService.editSessionTable(sessionId, {
    escopo: scope,
    ...(canEditCriteria ? { nome: payload.nome } : {}),
    criterios: criteriaPayload,
  });
  notify({ tone: 'success', message: 'Fórmula da sessão atualizada com sucesso.' });
  navigate(ROUTES.performanceTables, { replace: true, state: targetState });
  return res;
}

async function performSave(
  id: string,
  data: ReturnType<typeof useFetchTableInitialData>,
  notify: (t: { tone: 'success'; message: string }) => void,
  navigate: (to: string, opts?: { replace?: boolean; state?: unknown }) => void,
) {
  await submitUpdate(
    id,
    {
      nome: data.nome.trim(),
      descricao: data.descricao.trim() || null,
      criterios: data.criterios,
    },
    notify,
    navigate,
  );
}

async function performSessionSave(
  sessionId: string,
  scope: 'SESSAO' | 'TODAS',
  data: ReturnType<typeof useFetchTableInitialData>,
  notify: (t: { tone: 'success'; message: string }) => void,
  navigate: (to: string, opts?: { replace?: boolean; state?: unknown }) => void,
  targetState?: unknown,
) {
  const canEditCriteria = data.permissions?.podeEditarCriterios ?? true;
  await submitSessionUpdate(
    sessionId,
    scope,
    { nome: data.nome.trim(), criterios: data.criterios },
    canEditCriteria,
    notify,
    navigate,
    targetState,
  );
}

function useSaveExecution(
  id: string,
  data: ReturnType<typeof useFetchTableInitialData>,
  targetState?: unknown,
) {
  const navigate = useNavigate();
  const { notify } = useToast();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const prepareSave = (): boolean => {
    setErrorMessage(null);
    const totalWeight = data.criterios.reduce((sum, c) => sum + c.peso, 0);
    const err = validateEditFormula(data.nome, data.criterios.length, totalWeight);
    if (err) setErrorMessage(err);
    return !err;
  };

  const runWithSaving = async (action: () => Promise<void>) => {
    setIsSaving(true);
    try {
      await action();
    } catch (caught: unknown) {
      setErrorMessage(caught instanceof Error ? caught.message : 'Erro ao atualizar a fórmula.');
    } finally {
      setIsSaving(false);
    }
  };

  return {
    isSaving,
    prepareSave,
    executeSave: () => runWithSaving(() => performSave(id, data, notify, navigate)),
    executeSessionSave: (scope: 'SESSAO' | 'TODAS') =>
      data.activeSessionId &&
      runWithSaving(() =>
        performSessionSave(data.activeSessionId!, scope, data, notify, navigate, targetState),
      ),
    errorMessage,
    setErrorMessage,
    navigate,
  };
}

export function useEditPerformanceTableForm(id: string, sessionId?: string, targetState?: unknown) {
  const data = useFetchTableInitialData(id, sessionId);
  const save = useSaveExecution(id, data, targetState);
  const isDirty = useMemo(
    () =>
      checkIsDirty(
        { nome: data.nome, descricao: data.descricao, criterios: data.criterios },
        data.initialData,
      ),
    [data.nome, data.descricao, data.criterios, data.initialData],
  );

  return { ...data, ...save, isDirty };
}
