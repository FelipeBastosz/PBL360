import type { CriterionInput } from '@/types/performanceTable';
import { AddCriterionModal } from './AddCriterionModal';
import { EditCriterionModal } from './EditCriterionModal';
import { DeleteCriterionModal } from './DeleteCriterionModal';

type Props = {
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
};

export function CreatePerformanceTableModals(props: Props) {
  return (
    <>
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
      <DeleteCriterionModal
        isOpen={Boolean(props.criterionToDelete)}
        criterionName={props.criterionToDelete?.nome || ''}
        onConfirm={props.onConfirmDeleteCriterion}
        onCancel={props.onCloseDeleteCriterion}
      />
    </>
  );
}
