import { useState } from 'react';
import type { CriterionInput } from '@/types/performanceTable';

export function useEditModals(
  setCriterios: React.Dispatch<React.SetStateAction<CriterionInput[]>>,
) {
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCriterion, setEditingCriterion] = useState<CriterionInput | null>(null);
  const [criterionToDelete, setCriterionToDelete] = useState<CriterionInput | null>(null);
  const [isDeleteFormulaOpen, setIsDeleteFormulaOpen] = useState(false);

  const handleSaveCriterion = (upd: CriterionInput) => {
    setCriterios((prev) =>
      prev.map((c) => ((c.id && c.id === upd.id) || c.ordem === upd.ordem ? upd : c)),
    );
  };

  return {
    isInfoModalOpen,
    setIsInfoModalOpen,
    isAddModalOpen,
    setIsAddModalOpen,
    editingCriterion,
    setEditingCriterion,
    criterionToDelete,
    setCriterionToDelete,
    isDeleteFormulaOpen,
    setIsDeleteFormulaOpen,
    handleSaveCriterion,
  };
}
