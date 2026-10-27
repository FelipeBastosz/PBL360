import { useState } from 'react';
import { useToast } from '@/hooks/useToast';
import { evaluationService } from '@/services/evaluation.service';
import type { SelfAssessmentAdjustmentResponse } from '@/types/evaluation';
import type { StudentEvaluationHistoryItem } from '@/types/evaluationHistory';

type AdjustmentPayload = { novaNota: number; justificativa: string };

// Same save flow as the adjustment sheet on main: toast on success or failure.
export function useGradeAdjustment(
  sessionId: string | undefined,
  onAdjusted: (response: SelfAssessmentAdjustmentResponse) => void,
) {
  const { notify } = useToast();
  const [selected, setSelected] = useState<StudentEvaluationHistoryItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const save = async (payload: AdjustmentPayload) => {
    if (!selected || !sessionId) return;
    setIsSaving(true);
    try {
      const response = await evaluationService.adjustSelfAssessment(
        sessionId,
        selected.alunoId,
        payload,
      );
      onAdjusted(response);
      notify({ tone: 'success', message: 'Ajuste de nota salvo com sucesso!' });
      setSelected(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Não foi possível salvar o ajuste.';
      notify({ tone: 'error', message });
    } finally {
      setIsSaving(false);
    }
  };

  return { selected, setSelected, isSaving, save };
}
