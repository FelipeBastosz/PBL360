import { useState, useEffect, useCallback, useMemo } from 'react';
import { formulaService } from '@/services/formula.service';
import { sessionService } from '@/services/session.service';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { useToast } from '@/hooks/useToast';
import type { FinalGradeSessionWeight } from '@/types/formula';

async function fetchSessionMethod(sessaoId: string): Promise<string> {
  try {
    const rel = await sessionService.getReleases(sessaoId);
    if (rel.autoavaliacao.enviadas > 0 || rel.autoavaliacao.liberada) return 'Autoavaliação';
    if (rel.pares.enviadas > 0 || rel.pares.liberada) return 'Avaliação por Pares';
    return 'Avaliação do Tutor';
  } catch {
    return 'Avaliação do Tutor';
  }
}

async function fetchSessionMethods(
  sessions: FinalGradeSessionWeight[],
): Promise<Record<string, string>> {
  const entries = await Promise.all(
    sessions.map(async (s) => [s.sessaoId, await fetchSessionMethod(s.sessaoId)] as const),
  );
  return Object.fromEntries(entries);
}

function checkSimpleAverage(sessions: FinalGradeSessionWeight[]): boolean {
  if (sessions.length <= 1) return true;
  const firstWeight = sessions[0].peso;
  return sessions.every((s) => Math.abs(s.peso - firstWeight) < 0.001);
}

function sumWeights(sessions: FinalGradeSessionWeight[]): number {
  return sessions.reduce((sum, s) => sum + s.peso, 0);
}

export function useProblemFormulaViewModel(roomId: string, problemId: string) {
  const { notify } = useToast();
  const [sessions, setSessions] = useState<FinalGradeSessionWeight[]>([]);
  const [methods, setMethods] = useState<Record<string, string>>({});

  const fetcher = useCallback(
    () => formulaService.getFinalGrade(roomId, problemId),
    [roomId, problemId],
  );
  const { run: loadData, isLoading } = useAsyncAction(fetcher);
  const saveAction = useAsyncAction(formulaService.saveFinalGrade);
  const restoreAction = useAsyncAction(formulaService.restoreDefaultFinalGrade);

  useEffect(() => {
    loadData().then(async (res) => {
      if (res.ok && res.data) {
        setSessions(res.data.sessoes);
        const methodMap = await fetchSessionMethods(res.data.sessoes);
        setMethods(methodMap);
      }
    });
  }, [loadData]);

  const setWeight = (sessaoId: string, nextWeight: number) => {
    setSessions((prev) =>
      prev.map((s) => (s.sessaoId === sessaoId ? { ...s, peso: nextWeight } : s)),
    );
  };

  const save = async () => {
    const payload = sessions.map((s) => ({ sessaoId: s.sessaoId, peso: s.peso }));
    const res = await saveAction.run(roomId, problemId, payload);
    if (res.ok) notify({ tone: 'success', message: 'Fórmula da nota final salva com sucesso.' });
  };

  const restore = async () => {
    const res = await restoreAction.run(roomId, problemId);
    if (res.ok && res.data) {
      setSessions(res.data.sessoes);
      notify({ tone: 'success', message: 'Média simples restaurada com sucesso.' });
    }
  };

  return {
    sessions,
    methods,
    totalWeight: useMemo(() => sumWeights(sessions), [sessions]),
    isSimpleAverage: useMemo(() => checkSimpleAverage(sessions), [sessions]),
    setWeight,
    save,
    restore,
    isLoading,
    isSaving: saveAction.isLoading,
    isRestoring: restoreAction.isLoading,
  };
}
