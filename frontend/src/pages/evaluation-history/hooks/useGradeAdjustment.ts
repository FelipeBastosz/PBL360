import { useState } from 'react';
import { useToast } from '@/hooks/useToast';
import { evaluationService } from '@/services/evaluation.service';
import type { AdjustmentTarget, SelfAssessmentAdjustmentResponse } from '@/types/evaluation';
import type { StudentEvaluationHistoryItem } from '@/types/evaluationHistory';

type AdjustmentPayload = { novaNota: number; justificativa: string };

function adjustmentTargetOf(item: StudentEvaluationHistoryItem): AdjustmentTarget {
  if (item.origem === 'PLANNING_POKER' || item.origem === 'PARES') return 'PARES';
  if (item.origem === 'AUTOAVALIACAO') return 'AUTOAVALIACAO';
  return item.notaAluno === null ? 'PARES' : 'AUTOAVALIACAO';
}

// Same save flow as the adjustment sheet on main: toast on success or failure.
export function useGradeAdjustment(
  sessionId: string | undefined,
  onAdjusted: (response: SelfAssessmentAdjustmentResponse) => void,
) {
  const { notify } = useToast();
  const [selected, setSelectedItem] = useState<StudentEvaluationHistoryItem | null>(null);
  const [openCount, setOpenCount] = useState(0);
  const setSelected = (item: StudentEvaluationHistoryItem | null) => {
    setSelectedItem(item);
    if (item) setOpenCount((count) => count + 1);
  };
  const [isSaving, setIsSaving] = useState(false);

  const save = async (payload: AdjustmentPayload) => {
    if (!selected || !sessionId) return;
    setIsSaving(true);
    try {
      const payloadWithTipo = {
        ...payload,
        tipo: adjustmentTargetOf(selected),
      };
      const response = await evaluationService.adjustSelfAssessment(
        sessionId,
        selected.alunoId,
        payloadWithTipo,
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

  return { selected, setSelected, openCount, isSaving, save };
}
