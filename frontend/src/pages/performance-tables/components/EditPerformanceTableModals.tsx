import type { CriterionInput } from '@/types/performanceTable';
import { AddCriterionModal } from './AddCriterionModal';
import { EditCriterionModal } from './EditCriterionModal';
import { EditFormulaInfoModal } from './EditFormulaInfoModal';
import { DeleteCriterionModal } from './DeleteCriterionModal';
import { DeletePerformanceTableModal } from './DeletePerformanceTableModal';

type Props = {
  isInfoModalOpen: boolean;
  onCloseInfoModal: () => void;
  initialNome: string;
  initialDescricao: string;
  onSaveInfo: (data: { nome: string; descricao: string }) => void;
  isAddModalOpen: boolean;
  onCloseAddModal: () => void;
  onAddCriterion: (c: CriterionInput) => void;
  nextOrder: number;
  totalWeight: number;
  editingCriterion: CriterionInput | null;
  onCloseEditModal: () => void;
  onSaveCriterion: (c: CriterionInput) => void;
  otherWeightsSum: number;
  criterionToDelete: CriterionInput | null;
  onCloseDeleteCriterion: () => void;
  onConfirmDeleteCriterion: () => void;
  isDeleteFormulaOpen: boolean;
  isDeletingFormula: boolean;
  onCloseDeleteFormula: () => void;
  onConfirmDeleteFormula: () => void;
};

function ConfigModals(props: Props) {
  return (
    <>
      <EditFormulaInfoModal
        isOpen={props.isInfoModalOpen}
        onClose={props.onCloseInfoModal}
        initialNome={props.initialNome}
        initialDescricao={props.initialDescricao}
        onSave={props.onSaveInfo}
      />
      <AddCriterionModal
        isOpen={props.isAddModalOpen}
        onClose={props.onCloseAddModal}
        onAdd={props.onAddCriterion}
        nextOrder={props.nextOrder}
        currentTotalWeight={props.totalWeight}
      />
      <EditCriterionModal
        isOpen={Boolean(props.editingCriterion)}
        onClose={props.onCloseEditModal}
        criterion={props.editingCriterion}
        onSave={props.onSaveCriterion}
        otherWeightsSum={props.otherWeightsSum}
      />
    </>
  );
}

function DeletionModals(props: Props) {
  return (
    <>
      <DeleteCriterionModal
        isOpen={Boolean(props.criterionToDelete)}
        criterionName={props.criterionToDelete?.nome || ''}
        onConfirm={props.onConfirmDeleteCriterion}
        onCancel={props.onCloseDeleteCriterion}
      />
      <DeletePerformanceTableModal
        isOpen={props.isDeleteFormulaOpen}
        formulaTitle={props.initialNome}
        isLoading={props.isDeletingFormula}
        onConfirm={props.onConfirmDeleteFormula}
        onCancel={props.onCloseDeleteFormula}
      />
    </>
  );
}

export function EditPerformanceTableModals(props: Props) {
  return (
    <>
      <ConfigModals {...props} />
      <DeletionModals {...props} />
    </>
  );
}
