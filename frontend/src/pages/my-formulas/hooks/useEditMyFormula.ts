import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from '@/hooks/useToast';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { performanceTableService } from '@/services/performance-table.service';
import { ROUTES } from '@/routes/paths';
import type { CriterionInput } from '@/types/performanceTable';
import { isBalancedWeight, sumCriterionWeights } from '@/utils/criterionWeight';

export function validateEditFormula(nome: string, count: number, totalWeight: number) {
  if (!nome.trim()) return 'O título da fórmula é obrigatório.';
  if (count === 0) return 'A tabela deve possuir ao menos um critério.';
  if (!isBalancedWeight(totalWeight))
    return 'A soma dos pesos dos critérios deve ser exatamente 10.';
  return null;
}

export function checkIsDirty(
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

export function deleteCriterionFromList(
  criterios: CriterionInput[],
  target: CriterionInput | null,
): { error?: string; list: CriterionInput[] } {
  if (!target) return { list: criterios };
  if (criterios.length <= 1) {
    return { error: 'A fórmula deve possuir ao menos um critério.', list: criterios };
  }
  return {
    list: criterios.filter((c) => (c.id ? c.id !== target.id : c.ordem !== target.ordem)),
  };
}

export function useEditFormulaData(id: string) {
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

export function useFormulaMutations(id: string, onDone: () => void) {
  const { notify } = useToast();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function saveFormula(payload: {
    nome: string;
    descricao: string;
    criterios: CriterionInput[];
  }) {
    setIsSaving(true);
    try {
      await performanceTableService.update(id, {
        nome: payload.nome.trim(),
        descricao: payload.descricao.trim() || null,
        criterios: payload.criterios.map((c) => ({
          ...(c.id ? { id: c.id } : {}),
          nome: c.nome,
          descricao: c.descricao || null,
          ordem: c.ordem,
          peso: c.peso,
        })),
      });
      notify({ tone: 'success', message: 'Fórmula atualizada com sucesso.' });
      onDone();
    } catch (caught: unknown) {
      setErrorMessage(caught instanceof Error ? caught.message : 'Erro ao atualizar a fórmula.');
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteFormula() {
    setIsDeleting(true);
    try {
      await performanceTableService.remove(id);
      notify({ tone: 'success', message: 'Fórmula excluída com sucesso.' });
      onDone();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Erro ao excluir a fórmula.');
    } finally {
      setIsDeleting(false);
    }
  }

  return { saveFormula, deleteFormula, isSaving, isDeleting, errorMessage, setErrorMessage };
}

export function useFormulaModalStates() {
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCriterion, setEditingCriterion] = useState<CriterionInput | null>(null);
  const [criterionToDelete, setCriterionToDelete] = useState<CriterionInput | null>(null);
  const [isDeleteFormulaOpen, setIsDeleteFormulaOpen] = useState(false);
  const [isDiscardOpen, setIsDiscardOpen] = useState(false);
  const [isSaveWarningOpen, setIsSaveWarningOpen] = useState(false);

  return {
    isInfoModalOpen,
    setIsInfoModalOpen,
    isAddModalOpen,
    setIsAddModalOpen,
    editingCriterion,
    setEditingCriterion,
    criterionToDelete,
    setCriterionToDelete,
    isDeleteFormulaOpen,
    setIsDeleteFormulaOpen,
    isDiscardOpen,
    setIsDiscardOpen,
    isSaveWarningOpen,
    setIsSaveWarningOpen,
  };
}

function useEditFormulaActions(
  id: string,
  data: ReturnType<typeof useEditFormulaData>,
  modals: ReturnType<typeof useFormulaModalStates>,
) {
  const navigate = useNavigate();
  const { saveFormula, deleteFormula, isSaving, isDeleting, errorMessage, setErrorMessage } =
    useFormulaMutations(id, () => navigate(ROUTES.myFormulas, { replace: true }));

  const onConfirmSave = () => {
    modals.setIsSaveWarningOpen(false);
    saveFormula({ nome: data.nome, descricao: data.descricao, criterios: data.criterios });
  };

  const onConfirmDeleteFormula = () => {
    modals.setIsDeleteFormulaOpen(false);
    deleteFormula();
  };

  const onConfirmDeleteCriterion = () => {
    const res = deleteCriterionFromList(data.criterios, modals.criterionToDelete);
    if (res.error) setErrorMessage(res.error);
    else data.setCriterios(res.list);
    modals.setCriterionToDelete(null);
  };

  return {
    isSaving,
    isDeleting,
    errorMessage,
    setErrorMessage,
    onConfirmSave,
    onConfirmDeleteFormula,
    onConfirmDeleteCriterion,
  };
}

export function useEditMyFormulaController() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const data = useEditFormulaData(id!);
  const modals = useFormulaModalStates();
  const actions = useEditFormulaActions(id!, data, modals);

  const totalWeight = sumCriterionWeights(data.criterios);
  const otherWeightsSum = modals.editingCriterion
    ? totalWeight - modals.editingCriterion.peso
    : totalWeight;

  const isDirty = useMemo(
    () =>
      checkIsDirty(
        { nome: data.nome, descricao: data.descricao, criterios: data.criterios },
        data.initialData,
      ),
    [data.nome, data.descricao, data.criterios, data.initialData],
  );

  function handleRequestSave() {
    actions.setErrorMessage(null);
    const err = validateEditFormula(data.nome, data.criterios.length, totalWeight);
    if (err) return actions.setErrorMessage(err);
    modals.setIsSaveWarningOpen(true);
  }

  return {
    data,
    modals,
    totalWeight,
    otherWeightsSum,
    errorMessage: actions.errorMessage,
    isSaving: actions.isSaving,
    isDeleting: actions.isDeleting,
    handleRequestSave,
    handleConfirmSave: actions.onConfirmSave,
    handleConfirmDeleteFormula: actions.onConfirmDeleteFormula,
    handleConfirmDeleteCriterion: actions.onConfirmDeleteCriterion,
    handleExit: () => (isDirty ? modals.setIsDiscardOpen(true) : navigate(ROUTES.myFormulas)),
  };
}
