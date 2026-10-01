import type { PerformanceTable } from '@/types/performanceTable';
import type { DraftFormula } from '../components/FormulaAccordionCard';

export function hasUnsavedChanges(
  original?: PerformanceTable,
  currentDraft?: DraftFormula | null,
): boolean {
  if (!currentDraft) return false;
  if (!original) return true;
  if (original.nome !== currentDraft.nome) return true;
  if (original.criterios.length !== currentDraft.criterios.length) return true;

  return currentDraft.criterios.some((criterion, idx) => {
    const orig = original.criterios[idx];
    return !orig || orig.nome !== criterion.nome || orig.peso !== criterion.peso;
  });
}

export function validateDraft(draft: DraftFormula | null): {
  isValid: boolean;
  message?: string;
} {
  if (!draft) return { isValid: false };

  if (draft.nome.trim() === '') {
    return { isValid: false, message: 'Preencha o nome da fórmula antes de salvar.' };
  }

  if (draft.criterios.length === 0) {
    return {
      isValid: false,
      message: 'Você precisa adicionar critérios antes de salvar esta fórmula.',
    };
  }

  const hasEmptyName = draft.criterios.some((c) => c.nome.trim() === '');
  if (hasEmptyName) {
    return { isValid: false, message: 'Preencha o nome do critério antes de salvar.' };
  }

  const hasInvalidScore = draft.criterios.some((c) => c.peso < 0 || c.peso > 10);
  if (hasInvalidScore) {
    return { isValid: false, message: 'Cada critério deve ter nota entre 0 e 10.' };
  }

  const weightSum = draft.criterios.reduce((acc, c) => acc + c.peso, 0);
  // Tolera pequenas variações de ponto flutuante (ex: 9.99999999)
  if (Math.abs(weightSum - 10) > 0.01) {
    return { isValid: false, message: 'A soma dos critérios deve ser igual a 10 para salvar.' };
  }

  return { isValid: true };
}
