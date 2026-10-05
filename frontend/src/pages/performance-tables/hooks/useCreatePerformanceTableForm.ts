import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/useToast';
import { performanceTableService } from '@/services/performance-table.service';
import { ROUTES } from '@/routes/paths';
import type { CriterionInput } from '@/types/performanceTable';

function validateFormula(nome: string, count: number, totalWeight: number) {
  if (!nome.trim()) {
    return { error: 'O título da fórmula é obrigatório.', fields: { nome: true } };
  }
  if (count === 0) {
    return {
      error: 'A tabela de desempenho deve possuir ao menos um critério.',
      fields: { criterios: true },
    };
  }
  if (totalWeight !== 10) {
    return {
      error: 'A soma dos pesos dos critérios deve ser exatamente 10.',
      fields: { criterios: true },
    };
  }
  return null;
}

export function useCreatePerformanceTableForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { notify } = useToast();
  const initialData = (location.state as { nome?: string; descricao?: string }) || {};

  const [nome, setNome] = useState(initialData.nome || '');
  const [descricao] = useState(initialData.descricao || '');
  const [criterios, setCriterios] = useState<CriterionInput[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ nome?: boolean; criterios?: boolean }>({});

  const totalWeight = criterios.reduce((acc, c) => acc + c.peso, 0);

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
      });
      notify({ tone: 'success', message: 'Fórmula criada com sucesso.' });
      navigate(ROUTES.performanceTables, { replace: true });
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Ocorreu um erro ao salvar a fórmula.');
    }
  }

  return {
    nome,
    setNome,
    criterios,
    setCriterios,
    totalWeight,
    isModalOpen,
    setIsModalOpen,
    errorMessage,
    fieldErrors,
    setFieldErrors,
    handleSave,
    navigate,
  };
}
