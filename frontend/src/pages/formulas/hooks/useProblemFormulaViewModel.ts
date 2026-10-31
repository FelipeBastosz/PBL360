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

function useProblemFormulaData(roomId: string, problemId: string) {
  const [sessions, setSessions] = useState<FinalGradeSessionWeight[]>([]);
  const [methods, setMethods] = useState<Record<string, string>>({});
  const [isInitializing, setIsInitializing] = useState<boolean>(true);

  const fetcher = useCallback(
    () => formulaService.getFinalGrade(roomId, problemId),
    [roomId, problemId],
  );
  const loadAction = useAsyncAction(fetcher);
  const { run } = loadAction;

  useEffect(() => {
    let active = true;

    run().then(async (res) => {
      if (!active) return;
      if (res.ok && res.data) {
        setSessions(res.data.sessoes);
        const entries = await Promise.all(
          res.data.sessoes.map(
            async (s) => [s.sessaoId, await fetchSessionMethod(s.sessaoId)] as const,
          ),
        );
        if (active) setMethods(Object.fromEntries(entries));
      }
      if (active) setIsInitializing(false);
    });

    return () => {
      active = false;
    };
  }, [run]);

  return { sessions, setSessions, methods, isLoading: isInitializing || loadAction.isLoading };
}

export function useProblemFormulaViewModel(roomId: string, problemId: string) {
  const { notify } = useToast();
  const data = useProblemFormulaData(roomId, problemId);
  const saveAction = useAsyncAction(formulaService.saveFinalGrade);
  const restoreAction = useAsyncAction(formulaService.restoreDefaultFinalGrade);

  const totalWeight = useMemo(
    () => data.sessions.reduce((sum, s) => sum + s.peso, 0),
    [data.sessions],
  );

  const isSimpleAverage = useMemo(() => {
    if (data.sessions.length <= 1) return true;
    const first = data.sessions[0].peso;
    return data.sessions.every((s) => Math.abs(s.peso - first) < 0.001);
  }, [data.sessions]);

  const setWeight = (sessaoId: string, nextWeight: number) => {
    data.setSessions((prev) =>
      prev.map((s) => (s.sessaoId === sessaoId ? { ...s, peso: nextWeight } : s)),
    );
  };

  const save = async () => {
    const payload = data.sessions.map((s) => ({ sessaoId: s.sessaoId, peso: s.peso }));
    const res = await saveAction.run(roomId, problemId, payload);
    if (res.ok) notify({ tone: 'success', message: 'Fórmula da nota final salva com sucesso.' });
    else notify({ tone: 'error', message: 'Erro ao salvar a fórmula da nota final.' });
  };

  const restore = async () => {
    const res = await restoreAction.run(roomId, problemId);
    if (res.ok && res.data) {
      data.setSessions(res.data.sessoes);
      notify({ tone: 'success', message: 'Média simples restaurada com sucesso.' });
    } else {
      notify({ tone: 'error', message: 'Erro ao restaurar a fórmula padrão.' });
    }
  };

  return {
    sessions: data.sessions,
    methods: data.methods,
    totalWeight,
    isSimpleAverage,
    setWeight,
    save,
    restore,
    isLoading: data.isLoading,
    isSaving: saveAction.isLoading,
    isRestoring: restoreAction.isLoading,
  };
}
