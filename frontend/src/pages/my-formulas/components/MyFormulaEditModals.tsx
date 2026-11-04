import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/routes/paths';
import { EditPerformanceTableModals } from '@/pages/performance-tables/components/EditPerformanceTableModals';
import { DiscardChangesModal } from '@/pages/performance-tables/components/DiscardChangesModal';
import { SaveMyFormulaWarningModal } from './SaveMyFormulaWarningModal';
import type { useEditFormulaData, useFormulaModalStates } from '../hooks/useEditMyFormula';

interface ModalsProps {
  data: ReturnType<typeof useEditFormulaData>;
  modals: ReturnType<typeof useFormulaModalStates>;
  otherWeightsSum: number;
  totalWeight: number;
  isSaving: boolean;
  isDeleting: boolean;
  onSave: () => void;
  onDelete: () => void;
  onConfirmDeleteCriterion: () => void;
}

export function MyFormulaEditModals(props: ModalsProps) {
  const { data, modals, otherWeightsSum, totalWeight, isSaving, isDeleting, onSave, onDelete } =
    props;
  const navigate = useNavigate();

  return (
    <>
      <EditPerformanceTableModals
        isInfoModalOpen={modals.isInfoModalOpen}
        onCloseInfoModal={() => modals.setIsInfoModalOpen(false)}
        initialNome={data.nome}
        initialDescricao={data.descricao}
        onSaveInfo={({ nome, descricao }) => {
          data.setNome(nome);
          data.setDescricao(descricao);
        }}
        isAddModalOpen={modals.isAddModalOpen}
        onCloseAddModal={() => modals.setIsAddModalOpen(false)}
        onAddCriterion={(c) => data.setCriterios((prev) => [...prev, c])}
        nextOrder={data.criterios.length + 1}
        totalWeight={totalWeight}
        editingCriterion={modals.editingCriterion}
        onCloseEditModal={() => modals.setEditingCriterion(null)}
        onSaveCriterion={(upd) =>
          data.setCriterios((prev) =>
            prev.map((c) => ((c.id && c.id === upd.id) || c.ordem === upd.ordem ? upd : c)),
          )
        }
        otherWeightsSum={otherWeightsSum}
        criterionToDelete={modals.criterionToDelete}
        onCloseDeleteCriterion={() => modals.setCriterionToDelete(null)}
        onConfirmDeleteCriterion={props.onConfirmDeleteCriterion}
        isDeleteFormulaOpen={modals.isDeleteFormulaOpen}
        isDeletingFormula={isDeleting}
        onCloseDeleteFormula={() => modals.setIsDeleteFormulaOpen(false)}
        onConfirmDeleteFormula={onDelete}
      />
      <DiscardChangesModal
        isOpen={modals.isDiscardOpen}
        onConfirm={() => navigate(ROUTES.myFormulas)}
        onCancel={() => modals.setIsDiscardOpen(false)}
      />
      <SaveMyFormulaWarningModal
        isOpen={modals.isSaveWarningOpen}
        isLoading={isSaving}
        onConfirm={onSave}
        onCancel={() => modals.setIsSaveWarningOpen(false)}
      />
    </>
  );
}
