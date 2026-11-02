import { useState, useEffect, useCallback } from 'react';
import { sessionService } from '@/services/session.service';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { useToast } from '@/hooks/useToast';
import { type SessionFormulaComponentType } from '@/types/session';

type FormulaComponent = { tipo: SessionFormulaComponentType; peso: number };

function extractWeights(components: FormulaComponent[]) {
  const criterios = components.find((c) => c.tipo === 'CRITERIOS')?.peso ?? 70;
  const papel = components.find((c) => c.tipo === 'PAPEL')?.peso ?? 30;
  return {
    sessionWeight: Number((criterios / 10).toFixed(1)),
    roleWeight: Number((papel / 10).toFixed(1)),
  };
}

function buildPayload(sessionWeight: number, roleWeight: number, aplicar: boolean) {
  return {
    componentes: [
      { tipo: 'CRITERIOS' as const, peso: Math.round(sessionWeight * 10) },
      { tipo: 'PAPEL' as const, peso: Math.round(roleWeight * 10) },
    ],
    aplicarNasSeguintes: aplicar,
  };
}

function computeBalance(sw: number, rw: number) {
  const totalSum = Number((sw + rw).toFixed(1));
  return { totalSum, isBalanced: Math.abs(totalSum - 10.0) < 0.05 };
}

export function useSessionFormulaEditor(sessionId: string) {
  const { notify } = useToast();
  const [sessionWeight, setSW] = useState(7.0);
  const [roleWeight, setRW] = useState(3.0);
  const [isLocked, setIsLocked] = useState(false);

  const fetcher = useCallback(() => sessionService.getEvaluationConfig(sessionId), [sessionId]);
  const loadAction = useAsyncAction(fetcher);
  const saveAction = useAsyncAction(sessionService.updateFormula);
  const restoreAction = useAsyncAction(sessionService.restoreDefaultFormula);

  const applyWeights = useCallback((components: FormulaComponent[]) => {
    const w = extractWeights(components);
    setSW(w.sessionWeight);
    setRW(w.roleWeight);
  }, []);

  useEffect(() => {
    if (!sessionId) return;
    loadAction.run().then((res) => {
      if (!res.ok || !res.data) return;
      setIsLocked(res.data.bloqueada);
      if (res.data.formula?.componentes) applyWeights(res.data.formula.componentes);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, applyWeights]);

  const save = async (aplicar: boolean) => {
    const res = await saveAction.run(sessionId, buildPayload(sessionWeight, roleWeight, aplicar));
    if (res.ok) notify({ tone: 'success', message: 'Fórmula da nota final salva com sucesso.' });
    return res.ok;
  };

  const restore = async () => {
    const res = await restoreAction.run(sessionId);
    if (!res.ok || !res.data?.componentes) return;
    applyWeights(res.data.componentes);
    notify({ tone: 'success', message: 'Fórmula padrão (7,0 / 3,0) restaurada.' });
  };

  return {
    sessionWeight,
    setSessionWeight: setSW,
    roleWeight,
    setRoleWeight: setRW,
    ...computeBalance(sessionWeight, roleWeight),
    isLocked,
    isLoading: loadAction.isLoading,
    isSaving: saveAction.isLoading,
    isRestoring: restoreAction.isLoading,
    save,
    restore,
  };
}
