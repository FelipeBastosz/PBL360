import { FormulaAccordionCard, type DraftFormula } from './FormulaAccordionCard';

type Props = {
  draft: DraftFormula | null;
  onSave: (draft: DraftFormula) => void;
  onUpdateDraft: (draft: DraftFormula) => void;
  onCancel: () => void;
};

export function FormulaNewCard({ draft, onSave, onUpdateDraft, onCancel }: Props) {
  return (
    <FormulaAccordionCard
      formula={null}
      draft={draft}
      isExpanded={true}
      isEditing={true}
      onExpand={() => {}}
      onEdit={() => {}}
      onDeleteFormula={() => {}}
      onApplyFormula={() => {}}
      onCancelEdit={onCancel}
      onSaveEdit={onSave}
      onUpdateDraft={onUpdateDraft}
      onDeleteCriterion={(id) =>
        onUpdateDraft(
          draft
            ? { ...draft, criterios: draft.criterios.filter((c) => c.id !== id) }
            : { nome: '', criterios: [] },
        )
      }
    />
  );
}
