import { useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';
import { UserMenuButton } from '@/components/layout/UserMenu';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { performanceTableService } from '@/services/performance-table.service';
import { ROUTES } from '@/routes/paths';
import { readApplyTarget } from '@/utils/navigationState';
import { useEditPerformanceTableForm } from './hooks/useEditPerformanceTableForm';
import { useEditModals } from './hooks/useEditModals';
import { EditPageBody } from './components/EditPageBody';
import { EditModalsSection } from './components/EditModalsSection';
import { PAGE_CONTAINER_CLASS } from '@/components/ui/cardStyles';
import { cn } from '@/utils/cn';

function Header({ title, onBack }: { title: string; onBack: () => void }) {
  const { user } = useAuth();

  return (
    <header className="shrink-0 bg-brand-900 text-white">
      <div className={cn(PAGE_CONTAINER_CLASS, 'flex h-16 items-center justify-between')}>
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            aria-label="Voltar"
            className="-ml-1 rounded-full p-2 transition-[background-color,scale] duration-200 hover:bg-white/10 active:scale-90 focus-visible:outline-2 focus-visible:outline-white"
          >
            <ChevronLeftIcon className="size-6" strokeWidth={2} />
          </button>
          <h1 className="text-lg font-bold">{title}</h1>
        </div>
        <UserMenuButton user={user} />
      </div>
    </header>
  );
}

function useEditPageDeletion(
  id: string,
  form: ReturnType<typeof useEditPerformanceTableForm>,
  modals: ReturnType<typeof useEditModals>,
  notify: (t: { tone: 'success'; message: string }) => void,
) {
  const [isDeletingFormula, setIsDeletingFormula] = useState(false);

  function handleConfirmDeleteCriterion() {
    if (!modals.criterionToDelete) return;
    if (form.criterios.length <= 1) {
      form.setErrorMessage('A fórmula deve possuir ao menos um critério.');
      modals.setCriterionToDelete(null);
      return;
    }
    form.setCriterios((prev) =>
      prev.filter((c) =>
        c.id ? c.id !== modals.criterionToDelete!.id : c.ordem !== modals.criterionToDelete!.ordem,
      ),
    );
    modals.setCriterionToDelete(null);
  }

  async function handleConfirmDeleteFormula() {
    setIsDeletingFormula(true);
    try {
      await performanceTableService.remove(id);
      notify({ tone: 'success', message: 'Fórmula excluída com sucesso.' });
      form.navigate(ROUTES.performanceTables, { replace: true });
    } catch (err: unknown) {
      form.setErrorMessage(err instanceof Error ? err.message : 'Erro ao excluir a fórmula.');
    } finally {
      setIsDeletingFormula(false);
      modals.setIsDeleteFormulaOpen(false);
    }
  }

  return { isDeletingFormula, handleConfirmDeleteCriterion, handleConfirmDeleteFormula };
}

function usePageSessionState() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const locationState = location.state as Record<string, unknown> | null;
  const target = readApplyTarget(locationState);
  const sessionId =
    target?.sessionId ??
    (typeof locationState?.sessionId === 'string' ? locationState.sessionId : undefined);

  return { id: id!, sessionId, target, locationState };
}

function useEditPageDialogs(
  form: ReturnType<typeof useEditPerformanceTableForm>,
  modals: ReturnType<typeof useEditModals>,
  sessionId?: string,
) {
  const [isDiscardOpen, setIsDiscardOpen] = useState(false);
  const [isSaveWarningOpen, setIsSaveWarningOpen] = useState(false);
  const [isScopeModalOpen, setIsScopeModalOpen] = useState(false);

  const canEditCriteria = form.permissions ? form.permissions.podeEditarCriterios : true;
  const totalWeight = form.criterios.reduce((sum, c) => sum + c.peso, 0);
  const otherWeightsSum = modals.editingCriterion
    ? totalWeight - modals.editingCriterion.peso
    : totalWeight;

  const handleRequestSave = () => {
    if (!form.prepareSave()) return;
    if (sessionId) setIsScopeModalOpen(true);
    else setIsSaveWarningOpen(true);
  };

  const handleScopeSave = async (scope: 'SESSAO' | 'TODAS') => {
    await form.executeSessionSave(scope);
    setIsScopeModalOpen(false);
  };

  return {
    isDiscardOpen,
    setIsDiscardOpen,
    isSaveWarningOpen,
    setIsSaveWarningOpen,
    isScopeModalOpen,
    setIsScopeModalOpen,
    canEditCriteria,
    totalWeight,
    otherWeightsSum,
    handleRequestSave,
    handleScopeSave,
  };
}

export function EditPerformanceTablePage() {
  const { id, sessionId, target, locationState } = usePageSessionState();
  const form = useEditPerformanceTableForm(id, sessionId, target ?? locationState);
  const modals = useEditModals(form.setCriterios);
  const { notify } = useToast();
  const deletion = useEditPageDeletion(id, form, modals, notify);
  const dialogs = useEditPageDialogs(form, modals, sessionId);

  const onExit = () => (form.isDirty ? dialogs.setIsDiscardOpen(true) : form.navigate(-1));

  return (
    <div className="min-h-dvh bg-surface pb-12">
      <Header title={form.nome || 'Sessão de apresentação'} onBack={onExit} />
      <EditPageBody
        form={form}
        modals={modals}
        canEditCriteria={dialogs.canEditCriteria}
        isSessionContext={Boolean(sessionId)}
        onRequestSave={dialogs.handleRequestSave}
        onExit={onExit}
      />
      <EditModalsSection
        form={form}
        modals={modals}
        totalWeight={dialogs.totalWeight}
        otherWeightsSum={dialogs.otherWeightsSum}
        canEditCriteria={dialogs.canEditCriteria}
        onConfirmDeleteCriterion={deletion.handleConfirmDeleteCriterion}
        isDeletingFormula={deletion.isDeletingFormula}
        onConfirmDeleteFormula={deletion.handleConfirmDeleteFormula}
        isDiscardOpen={dialogs.isDiscardOpen}
        onCloseDiscard={() => dialogs.setIsDiscardOpen(false)}
        isSaveWarningOpen={dialogs.isSaveWarningOpen}
        onCloseSaveWarning={() => dialogs.setIsSaveWarningOpen(false)}
        isScopeModalOpen={dialogs.isScopeModalOpen}
        onCloseScopeModal={() => dialogs.setIsScopeModalOpen(false)}
        onConfirmScopeSave={dialogs.handleScopeSave}
      />
    </div>
  );
}

export default EditPerformanceTablePage;
