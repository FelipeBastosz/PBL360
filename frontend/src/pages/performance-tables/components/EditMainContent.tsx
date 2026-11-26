import { Spinner } from '@/components/ui/Spinner';
import { DescriptionCard, EditActions } from './EditPerformanceTableCards';
import { EditCriteriaCard } from './EditCriteriaCard';
import { FormulaBalanceSummary } from './FormulaBalanceSummary';
import type { useEditPerformanceTableForm } from '../hooks/useEditPerformanceTableForm';
import type { useEditModals } from '../hooks/useEditModals';

type MainContentProps = {
  form: ReturnType<typeof useEditPerformanceTableForm>;
  modals: ReturnType<typeof useEditModals>;
  canEditCriteria: boolean;
  isSessionContext: boolean;
  totalWeight: number;
  onRequestSave: () => void;
  onExit: () => void;
};

export function EditMainContent({
  form,
  modals,
  canEditCriteria,
  isSessionContext,
  totalWeight,
  onRequestSave,
  onExit,
}: MainContentProps) {
  if (form.isLoading) {
    return (
      <div className="mt-12 flex justify-center">
        <Spinner className="size-8 text-brand-accent" />
      </div>
    );
  }

  return (
    <>
      <DescriptionCard
        description={form.descricao}
        canEditInfo={canEditCriteria}
        onOpenEdit={() => modals.setIsInfoModalOpen(true)}
      />
      <EditCriteriaCard
        items={form.criterios}
        canEditCriteria={canEditCriteria}
        onOpenAdd={() => modals.setIsAddModalOpen(true)}
        onOpenEdit={modals.setEditingCriterion}
        onOpenDelete={modals.setCriterionToDelete}
      />
      <FormulaBalanceSummary totalWeight={totalWeight} />
      <EditActions
        onSave={onRequestSave}
        onCancel={onExit}
        canDeleteFormula={!isSessionContext}
        onDeleteFormula={() => modals.setIsDeleteFormulaOpen(true)}
        disabled={totalWeight !== 10}
      />
    </>
  );
}
