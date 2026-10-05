import type { CriterionInput } from '@/types/performanceTable';
import { AddCriterionModal } from './AddCriterionModal';
import { EditCriterionModal } from './EditCriterionModal';
import { EditFormulaInfoModal } from './EditFormulaInfoModal';

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
};

export function EditPerformanceTableModals({
  isInfoModalOpen,
  onCloseInfoModal,
  initialNome,
  initialDescricao,
  onSaveInfo,
  isAddModalOpen,
  onCloseAddModal,
  onAddCriterion,
  nextOrder,
  totalWeight,
  editingCriterion,
  onCloseEditModal,
  onSaveCriterion,
  otherWeightsSum,
}: Props) {
  return (
    <>
      <EditFormulaInfoModal
        isOpen={isInfoModalOpen}
        onClose={onCloseInfoModal}
        initialNome={initialNome}
        initialDescricao={initialDescricao}
        onSave={onSaveInfo}
      />
      <AddCriterionModal
        isOpen={isAddModalOpen}
        onClose={onCloseAddModal}
        onAdd={onAddCriterion}
        nextOrder={nextOrder}
        currentTotalWeight={totalWeight}
      />
      <EditCriterionModal
        isOpen={Boolean(editingCriterion)}
        onClose={onCloseEditModal}
        criterion={editingCriterion}
        onSave={onSaveCriterion}
        otherWeightsSum={otherWeightsSum}
      />
    </>
  );
}
