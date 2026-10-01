import { useState, useEffect } from 'react';
import type { PerformanceTable, PerformanceTableSummary } from '@/types/performanceTable';
import type { DraftFormula } from '../components/FormulaAccordionCard';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { performanceTableService } from '@/services/performance-table.service';
import { hasUnsavedChanges, validateDraft } from '../utils/formulaValidation';
import type { useFormulaList } from './useFormulaList';
import type { useFormulaDialogs } from './useFormulaDialogs';

type ListHook = ReturnType<typeof useFormulaList>;
type DialogsHook = ReturnType<typeof useFormulaDialogs>;

function toPayload(draft: DraftFormula) {
  return {
    nome: draft.nome,
    criterios: draft.criterios.map((c, i) => ({ nome: c.nome, peso: c.peso, ordem: i + 1 })),
  };
}

function useFormulaDraftState() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<DraftFormula | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [currentFormulaId, setCurrentFormulaId] = useState<string | null>(null);
  return {
    expandedId,
    setExpandedId,
    editingId,
    setEditingId,
    draft,
    setDraft,
    isCreatingNew,
    setIsCreatingNew,
    currentFormulaId,
    setCurrentFormulaId,
  };
}

type DraftState = ReturnType<typeof useFormulaDraftState>;

function useFormulaSaveAction(
  setLoadedDetails: React.Dispatch<React.SetStateAction<Record<string, PerformanceTable>>>,
  setSummaries: React.Dispatch<React.SetStateAction<PerformanceTableSummary[]>>,
  showSnackbar: (msg: string) => void,
) {
  const { run: createFormula, isLoading: isCreating } = useAsyncAction(
    performanceTableService.create,
  );
  const { run: updateFormula, isLoading: isUpdating } = useAsyncAction(
    performanceTableService.update,
  );

  const save = async (
    draft: DraftFormula,
    isNew: boolean,
    editId: string | null,
    onDone: (id: string) => void,
  ) => {
    const payload = toPayload(draft);
    const res = isNew ? await createFormula(payload) : await updateFormula(editId!, payload);
    if (!res.ok) return;

    setLoadedDetails((p) => ({ ...p, [res.data.id]: res.data }));
    if (isNew) {
      setSummaries((p) => [...p, { ...res.data, quantidadeCriterios: res.data.criterios.length }]);
    } else {
      setSummaries((p) =>
        p.map((s) =>
          s.id === res.data.id
            ? { ...s, nome: res.data.nome, quantidadeCriterios: res.data.criterios.length }
            : s,
        ),
      );
    }
    onDone(res.data.id);
    showSnackbar('Fórmula salva com sucesso.');
  };

  return { save, isSaving: isCreating || isUpdating };
}

function useFormulaExpand(state: DraftState, list: ListHook, dialogs: DialogsHook) {
  return (id: string) => {
    const proceed = () => {
      state.setEditingId(null);
      state.setDraft(null);
      state.setIsCreatingNew(false);
      state.setExpandedId((prev) => (prev === id ? null : id));
      if (state.expandedId !== id) void list.loadDetails(id);
    };

    if (
      state.editingId &&
      state.editingId !== id &&
      hasUnsavedChanges(list.loadedDetails[state.editingId], state.draft)
    ) {
      dialogs.setModal({
        isOpen: true,
        type: 'UNSAVED_CHANGES',
        message: 'Sair sem salvar? Suas edições recentes serão perdidas.',
        primaryActionLabel: 'Sair',
        isDestructive: true,
        onConfirm: () => {
          dialogs.closeModal();
          proceed();
        },
      });
      return;
    }
    proceed();
  };
}

function useFormulaSubmit(
  state: DraftState,
  save: (
    draft: DraftFormula,
    isNew: boolean,
    editId: string | null,
    onDone: (id: string) => void,
  ) => Promise<void>,
  dialogs: DialogsHook,
) {
  return async (draftToSave: DraftFormula) => {
    const check = validateDraft(draftToSave);
    if (!check.isValid) {
      dialogs.setModal({
        isOpen: true,
        type: 'VALIDATION_ERROR',
        message: check.message || 'Erro de validação.',
        primaryActionLabel: 'Cancelar',
        isDestructive: true,
        onConfirm: dialogs.closeModal,
      });
      return;
    }
    await save(draftToSave, state.isCreatingNew, state.editingId, (id) => {
      state.setIsCreatingNew(false);
      state.setEditingId(null);
      state.setExpandedId(id);
    });
  };
}

export function useFormulasManager(list: ListHook, dialogs: DialogsHook) {
  const state = useFormulaDraftState();
  const { save, isSaving } = useFormulaSaveAction(
    list.setLoadedDetails,
    list.setSummaries,
    dialogs.showSnackbar,
  );
  const { run: deleteFormula, isLoading: isDeleting } = useAsyncAction(
    performanceTableService.remove,
  );

  // Ao carregar a lista, define automaticamente a fórmula padrão como ativa
  const { currentFormulaId, setCurrentFormulaId } = state;
  useEffect(() => {
    if (currentFormulaId === null && list.filteredSummaries.length > 0) {
      const defaultFormula = list.filteredSummaries.find((s) => s.isDefault);
      if (defaultFormula) {
        setCurrentFormulaId(defaultFormula.id);
      }
    }
  }, [currentFormulaId, list.filteredSummaries, setCurrentFormulaId]);

  const handleExpand = useFormulaExpand(state, list, dialogs);
  const handleSave = useFormulaSubmit(state, save, dialogs);

  const startCreate = () => {
    state.setIsCreatingNew(true);
    state.setExpandedId('new-draft');
    state.setEditingId('new-draft');
    state.setDraft({ nome: '', criterios: [] });
  };

  return {
    ...state,
    handleExpand,
    handleSave,
    deleteFormula,
    startCreate,
    isProcessing: isDeleting || isSaving,
  };
}

export type FormulasManager = ReturnType<typeof useFormulasManager>;
