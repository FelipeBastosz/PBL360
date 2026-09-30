import type { PerformanceTable } from '@/types/performanceTable';
import { FormulaCriterionRow } from './FormulaCriterionRow';
import { FormulaCardActions } from './FormulaCardActions';
import { FormulaCardHeader } from './FormulaCardHeader';

export type DraftCriterion = { id: string; nome: string; peso: number; isInvalid?: boolean };
export type DraftFormula = { nome: string; criterios: DraftCriterion[] };

type CardProps = {
  formula: PerformanceTable | null;
  draft?: DraftFormula | null;
  isExpanded: boolean;
  isEditing: boolean;
  onExpand: () => void;
  onEdit: () => void;
  onDeleteFormula: () => void;
  onApplyFormula: () => void;
  onCancelEdit: () => void;
  onSaveEdit: (draft: DraftFormula) => void;
  onUpdateDraft: (draft: DraftFormula) => void;
  onDeleteCriterion: (id: string, name: string) => void;
};

function AddCriterionButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center px-4 py-3 bg-[#e6e6e6] text-sm font-bold text-brand-900 hover:bg-black/5 border-b border-black/5"
    >
      + Adicionar criterio
    </button>
  );
}

function AccordionBody(
  props: CardProps & {
    onNameChange: (id: string, name: string) => void;
    onWeightChange: (id: string, val: string) => void;
  },
) {
  const { formula, draft, isEditing, onNameChange, onWeightChange, onDeleteCriterion } = props;
  const criteria = isEditing ? draft?.criterios : formula?.criterios;

  const handleAddCriterion = () => {
    if (!draft) return;
    props.onUpdateDraft({
      ...draft,
      criterios: [
        ...draft.criterios,
        { id: `new-${Date.now()}`, nome: '', peso: 0, isInvalid: true },
      ],
    });
  };

  return (
    <div className="flex flex-col bg-[#e6e6e6] animate-slide-down">
      {criteria?.map((item, idx) => (
        <FormulaCriterionRow
          key={item.id || idx}
          criterion={item}
          index={idx}
          isEditing={isEditing}
          isDefault={formula?.isDefault}
          onNameChange={onNameChange}
          onWeightChange={onWeightChange}
          onDelete={onDeleteCriterion}
        />
      ))}
      {isEditing && !formula?.isDefault && <AddCriterionButton onClick={handleAddCriterion} />}
      <FormulaCardActions
        isEditing={isEditing}
        isDefault={formula?.isDefault}
        isCurrent={formula?.ativo}
        onCancelEdit={props.onCancelEdit}
        onSaveEdit={() => draft && props.onSaveEdit(draft)}
        onApplyFormula={props.onApplyFormula}
        onEdit={props.onEdit}
        onDeleteFormula={props.onDeleteFormula}
      />
    </div>
  );
}

export function FormulaAccordionCard(props: CardProps) {
  const { formula, draft, isExpanded, isEditing, onExpand, onUpdateDraft } = props;

  const onWeightChange = (id: string, val: string) => {
    if (!draft) return;
    const peso = parseInt(val.replace(/\D/g, ''), 10) || 0;
    onUpdateDraft({
      ...draft,
      criterios: draft.criterios.map((c) => (c.id === id ? { ...c, peso } : c)),
    });
  };

  const onNameChange = (id: string, nome: string) => {
    if (!draft) return;
    onUpdateDraft({
      ...draft,
      criterios: draft.criterios.map((c) =>
        c.id === id ? { ...c, nome, isInvalid: !nome.trim() } : c,
      ),
    });
  };

  return (
    <div className="w-full bg-white rounded-xl shadow-sm border border-black/5 overflow-hidden flex flex-col mb-3">
      <FormulaCardHeader
        displayTitle={isEditing ? draft?.nome : formula?.nome}
        draftName={draft?.nome}
        isExpanded={isExpanded}
        isEditing={isEditing}
        isDefault={formula?.isDefault}
        isCurrent={formula?.ativo}
        onExpand={onExpand}
        onNameChange={(name) => draft && onUpdateDraft({ ...draft, nome: name })}
      />
      {isExpanded && (
        <AccordionBody {...props} onNameChange={onNameChange} onWeightChange={onWeightChange} />
      )}
    </div>
  );
}
