import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/useToast';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { performanceTableService } from '@/services/performance-table.service';
import { ROUTES } from '@/routes/paths';
import { readApplyTarget } from '@/utils/navigationState';
import type { CriterionInput } from '@/types/performanceTable';

function validateEditFormula(nome: string, count: number, totalWeight: number) {
  if (!nome.trim()) return 'O título da fórmula é obrigatório.';
  if (count === 0) return 'A tabela deve possuir ao menos um critério.';
  if (totalWeight !== 10) return 'A soma dos pesos dos critérios deve ser exatamente 10.';
  return null;
}

function checkIsDirty(
  current: { nome: string; descricao: string; criterios: CriterionInput[] },
  initial: { nome: string; descricao: string; criterios: CriterionInput[] } | null,
) {
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
  await performanceTableService.update(id, payload);
  notify({ tone: 'success', message: 'Fórmula atualizada com sucesso.' });
  const target = readApplyTarget(null);
  navigate(ROUTES.performanceTables, { replace: true, state: target });
}

function useFetchTableInitialData(id: string) {
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [criterios, setCriterios] = useState<CriterionInput[]>([]);
  const [initialData, setInitialData] = useState<{
    nome: string;
    descricao: string;
    criterios: CriterionInput[];
  } | null>(null);

  const fetchTable = useCallback(() => performanceTableService.getById(id), [id]);
  const { run, isLoading, error } = useAsyncAction(fetchTable);

  useEffect(() => {
    run().then((res) => {
      if (res.ok) {
        setNome(res.data.nome);
        setDescricao(res.data.descricao || '');
        setCriterios(res.data.criterios);
        setInitialData({
          nome: res.data.nome,
          descricao: res.data.descricao || '',
          criterios: res.data.criterios,
        });
      }
    });
  }, [run]);

  return {
    nome,
    setNome,
    descricao,
    setDescricao,
    criterios,
    setCriterios,
    initialData,
    isLoading,
    error,
  };
}

function useSaveExecution(id: string, data: ReturnType<typeof useFetchTableInitialData>) {
  const navigate = useNavigate();
  const { notify } = useToast();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  function prepareSave(): boolean {
    setErrorMessage(null);
    const totalWeight = data.criterios.reduce((sum, c) => sum + c.peso, 0);
    const err = validateEditFormula(data.nome, data.criterios.length, totalWeight);
    if (err) {
      setErrorMessage(err);
      return false;
    }
    return true;
  }

  async function executeSave() {
    setIsSaving(true);
    try {
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
    } catch (caught: unknown) {
      setErrorMessage(caught instanceof Error ? caught.message : 'Erro ao atualizar a fórmula.');
    } finally {
      setIsSaving(false);
    }
  }

  return { isSaving, prepareSave, executeSave, errorMessage, setErrorMessage, navigate };
}

export function useEditPerformanceTableForm(id: string) {
  const data = useFetchTableInitialData(id);
  const save = useSaveExecution(id, data);
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
