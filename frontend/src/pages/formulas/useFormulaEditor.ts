import { useCallback, useEffect, useState } from 'react';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { useToast } from '@/hooks/useToast';
import { formulaService } from '@/services/formula.service';
import type { Formula, FormulaComponent, FormulaScope } from '@/types/formula';
import { componentKey } from '@/utils/formula';

const SAVED_MESSAGE = 'Fórmula salva. Ela vale para todas as sessões deste problema.';
const RESTORED_MESSAGE = 'Fórmula padrão restaurada.';

function useFormulaRequests() {
  const load = useAsyncAction(formulaService.get);
  const save = useAsyncAction(formulaService.save);
  const restore = useAsyncAction(formulaService.restoreDefault);
  return { load, save, restore };
}

export function useFormulaEditor(roomId: string, problemId: string, scope: FormulaScope) {
  const { notify } = useToast();
  const { load, save, restore } = useFormulaRequests();
  const [formula, setFormula] = useState<Formula | null>(null);
  const [components, setComponents] = useState<FormulaComponent[]>([]);
  const fetchFormula = load.run;

  const apply = useCallback((next: Formula) => {
    setFormula(next);
    setComponents(next.componentes);
  }, []);

  useEffect(() => {
    fetchFormula(roomId, problemId, scope).then((result) => result.ok && apply(result.data));
  }, [roomId, problemId, scope, fetchFormula, apply]);

  function setWeight(key: string, peso: number) {
    setComponents((current) =>
      current.map((component) =>
        componentKey(component) === key ? { ...component, peso } : component,
      ),
    );
  }

  async function submit(request: Promise<{ ok: boolean; data?: Formula }>, message: string) {
    const result = await request;
    if (!result.ok || !result.data) return;
    apply(result.data);
    notify({ tone: 'success', message });
  }

  return {
    formula,
    components,
    isLoading: load.isLoading,
    loadError: load.error,
    actionError: save.error ?? restore.error,
    isSaving: save.isLoading,
    isRestoring: restore.isLoading,
    setWeight,
    add: (component: FormulaComponent) => setComponents((current) => [...current, component]),
    save: () => submit(save.run(roomId, problemId, scope, components), SAVED_MESSAGE),
    restore: () => submit(restore.run(roomId, problemId, scope), RESTORED_MESSAGE),
  };
}
