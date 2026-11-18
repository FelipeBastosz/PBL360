import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/useToast';
import { performanceTableService } from '@/services/performance-table.service';
import { ROUTES } from '@/routes/paths';
import type { CriterionInput } from '@/types/performanceTable';

export function validateFormula(nome: string, count: number, totalWeight: number) {
  if (!nome.trim()) {
    return { error: 'O título da fórmula é obrigatório.', fields: { nome: true } };
  }
  if (count === 0) {
    return {
      error: 'A tabela de desempenho deve possuir ao menos um critério.',
      fields: { criterios: true },
    };
  }
  if (Math.round((totalWeight + Number.EPSILON) * 10) / 10 !== 10) {
    return {
      error: 'A soma dos pesos dos critérios deve ser exatamente 10.',
      fields: { criterios: true },
    };
  }
  return null;
}

function useCreateFormulaInputs() {
  const location = useLocation();
  const state = (location.state as { nome?: string; descricao?: string }) || {};
  const [nome, setNome] = useState(state.nome || '');
  const [descricao] = useState(state.descricao || '');
  const [criterios, setCriterios] = useState<CriterionInput[]>([]);
  return { nome, setNome, descricao, criterios, setCriterios };
}

function useCreateFormulaModals() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCriterion, setEditingCriterion] = useState<CriterionInput | null>(null);
  const [criterionToDelete, setCriterionToDelete] = useState<CriterionInput | null>(null);
  return {
    isAddModalOpen,
    setIsAddModalOpen,
    editingCriterion,
    setEditingCriterion,
    criterionToDelete,
    setCriterionToDelete,
  };
}

export function useCreateMyFormula() {
  const navigate = useNavigate();
  const { notify } = useToast();
  const { nome, setNome, descricao, criterios, setCriterios } = useCreateFormulaInputs();
  const modals = useCreateFormulaModals();

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ nome?: boolean; criterios?: boolean }>({});

  const totalWeight =
    Math.round((criterios.reduce((acc, c) => acc + c.peso, 0) + Number.EPSILON) * 10) / 10;
  const otherWeightsSum = modals.editingCriterion
    ? totalWeight - modals.editingCriterion.peso
    : totalWeight;

  async function handleSave() {
    setErrorMessage(null);
    const validation = validateFormula(nome, criterios.length, totalWeight);
    if (validation) {
      setErrorMessage(validation.error);
      setFieldErrors(validation.fields);
      return;
    }
    try {
      await performanceTableService.create({
        nome: nome.trim(),
        descricao: descricao.trim() || undefined,
        criterios,
        roomId: undefined,
      });
      notify({ tone: 'success', message: 'Fórmula criada com sucesso.' });
      navigate(ROUTES.myFormulas, { replace: true });
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Ocorreu um erro ao salvar a fórmula.');
    }
  }

  return {
    navigate,
    nome,
    setNome,
    criterios,
    setCriterios,
    errorMessage,
    fieldErrors,
    setFieldErrors,
    totalWeight,
    otherWeightsSum,
    handleSave,
    ...modals,
  };
}
