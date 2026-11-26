import { useState } from 'react';
import { formatWeightChange, stepCriterionWeight } from '@/utils/criterionWeight';

export function useCriterionWeightInput(initialWeight = '1', onResetError?: () => void) {
  const [peso, setPeso] = useState(initialWeight);

  function handleWeightChange(raw: string) {
    const text = formatWeightChange(raw);
    if (text === null) return;
    setPeso(text);
    onResetError?.();
  }

  function handleWeightStep(delta: number) {
    setPeso(stepCriterionWeight(peso, delta));
    onResetError?.();
  }

  function handleWeightKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      handleWeightStep(e.key === 'ArrowUp' ? 1 : -1);
    }
  }

  return {
    peso,
    setPeso,
    handleWeightChange,
    handleWeightStep,
    handleWeightKeyDown,
  };
}
