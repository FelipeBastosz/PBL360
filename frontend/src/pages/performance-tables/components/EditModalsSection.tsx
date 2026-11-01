import type { useEditPerformanceTableForm } from '../hooks/useEditPerformanceTableForm';
import type { useEditModals } from '../hooks/useEditModals';
import { EditPerformanceTableModals } from './EditPerformanceTableModals';
import { DiscardChangesModal } from './DiscardChangesModal';
import { SaveFormulaWarningModal } from './SaveFormulaWarningModal';
import { EditScopeModal } from './EditScopeModal';

type ModalsProps = {
  form: ReturnType<typeof useEditPerformanceTableForm>;
  modals: ReturnType<typeof useEditModals>;
  totalWeight: number;
  otherWeightsSum: number;
  canEditCriteria: boolean;
  onConfirmDeleteCriterion: () => void;
  isDeletingFormula: boolean;
  onConfirmDeleteFormula: () => void;
  isDiscardOpen: boolean;
  onCloseDiscard: () => void;
  isSaveWarningOpen: boolean;
  onCloseSaveWarning: () => void;
  isScopeModalOpen: boolean;
  onCloseScopeModal: () => void;
  onConfirmScopeSave: (scope: 'SESSAO' | 'TODAS') => void;
};

function BaseActionModals(props: ModalsProps) {
  return (
    <>
      <DiscardChangesModal
        isOpen={props.isDiscardOpen}
        onConfirm={() => props.form.navigate(-1)}
        onCancel={props.onCloseDiscard}
      />
      <SaveFormulaWarningModal
        isOpen={props.isSaveWarningOpen}
        isLoading={props.form.isSaving}
        onConfirm={props.form.executeSave}
        onCancel={props.onCloseSaveWarning}
      />
      <EditScopeModal
        isOpen={props.isScopeModalOpen}
        isLoading={props.form.isSaving}
        sessions={props.form.permissions?.sessoesQueUsam ?? []}
        onConfirm={props.onConfirmScopeSave}
        onCancel={props.onCloseScopeModal}
      />
    </>
  );
}

export function EditModalsSection(props: ModalsProps) {
  return (
    <>
      <EditPerformanceTableModals
        isInfoModalOpen={props.modals.isInfoModalOpen}
        onCloseInfoModal={() => props.modals.setIsInfoModalOpen(false)}
        initialNome={props.form.nome}
        initialDescricao={props.form.descricao}
        onSaveInfo={({ nome, descricao }) => {
          props.form.setNome(nome);
          props.form.setDescricao(descricao);
        }}
        isAddModalOpen={props.modals.isAddModalOpen}
        onCloseAddModal={() => props.modals.setIsAddModalOpen(false)}
        onAddCriterion={(c) => props.form.setCriterios((prev) => [...prev, c])}
        nextOrder={props.form.criterios.length + 1}
        totalWeight={props.totalWeight}
        editingCriterion={props.modals.editingCriterion}
        onCloseEditModal={() => props.modals.setEditingCriterion(null)}
        onSaveCriterion={props.modals.handleSaveCriterion}
        otherWeightsSum={props.otherWeightsSum}
        criterionToDelete={props.modals.criterionToDelete}
        onCloseDeleteCriterion={() => props.modals.setCriterionToDelete(null)}
        onConfirmDeleteCriterion={props.onConfirmDeleteCriterion}
        isDeleteFormulaOpen={props.modals.isDeleteFormulaOpen}
        isDeletingFormula={props.isDeletingFormula}
        onCloseDeleteFormula={() => props.modals.setIsDeleteFormulaOpen(false)}
        onConfirmDeleteFormula={props.onConfirmDeleteFormula}
        canEditCriteria={props.canEditCriteria}
      />
      <BaseActionModals {...props} />
    </>
  );
}
