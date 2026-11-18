import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { EditCriteriaCard } from '@/pages/performance-tables/components/EditCriteriaCard';
import {
  DescriptionCard,
  EditActions,
} from '@/pages/performance-tables/components/EditPerformanceTableCards';
import { FormulaBalanceSummary } from '@/pages/performance-tables/components/FormulaBalanceSummary';
import { MyFormulasHeader } from './components/MyFormulasHeader';
import { MyFormulaEditModals } from './components/MyFormulaEditModals';
import { useEditMyFormulaController } from './hooks/useEditMyFormula';

function EditMyFormulaMain({ ctrl }: { ctrl: ReturnType<typeof useEditMyFormulaController> }) {
  return (
    <main className="mx-auto mt-4 flex w-full max-w-md flex-col gap-4 px-4">
      {(ctrl.errorMessage || ctrl.data.error) && (
        <Alert tone="error">{ctrl.errorMessage || ctrl.data.error?.message}</Alert>
      )}
      {ctrl.data.isLoading ? (
        <div className="mt-12 flex justify-center">
          <Spinner className="size-8 text-brand-900" />
        </div>
      ) : (
        <>
          <DescriptionCard
            description={ctrl.data.descricao}
            onOpenEdit={() => ctrl.modals.setIsInfoModalOpen(true)}
          />
          <EditCriteriaCard
            items={ctrl.data.criterios}
            onOpenAdd={() => ctrl.modals.setIsAddModalOpen(true)}
            onOpenEdit={ctrl.modals.setEditingCriterion}
            onOpenDelete={ctrl.modals.setCriterionToDelete}
          />
          <FormulaBalanceSummary totalWeight={ctrl.totalWeight} />
          <EditActions
            disabled={ctrl.totalWeight !== 10}
            onSave={ctrl.handleRequestSave}
            onCancel={ctrl.handleExit}
            onDeleteFormula={() => ctrl.modals.setIsDeleteFormulaOpen(true)}
          />
        </>
      )}
    </main>
  );
}

export function EditMyFormulaPage() {
  const ctrl = useEditMyFormulaController();

  return (
    <div className="min-h-dvh bg-surface pb-12">
      <MyFormulasHeader title={ctrl.data.nome || 'Editar fórmula'} />
      <EditMyFormulaMain ctrl={ctrl} />
      <MyFormulaEditModals
        data={ctrl.data}
        modals={ctrl.modals}
        otherWeightsSum={ctrl.otherWeightsSum}
        totalWeight={ctrl.totalWeight}
        isSaving={ctrl.isSaving}
        isDeleting={ctrl.isDeleting}
        onSave={ctrl.handleConfirmSave}
        onDelete={ctrl.handleConfirmDeleteFormula}
        onConfirmDeleteCriterion={ctrl.handleConfirmDeleteCriterion}
      />
    </div>
  );
}

export default EditMyFormulaPage;
