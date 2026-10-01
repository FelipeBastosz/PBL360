import { TrashIcon } from '@heroicons/react/24/outline';
import { cn } from '@/utils/cn';
import type { DraftCriterion } from './FormulaAccordionCard';

type Props = {
  criterion: DraftCriterion;
  index: number;
  isEditing: boolean;
  isDefault?: boolean;
  onNameChange: (id: string, name: string) => void;
  onWeightChange: (id: string, weight: string) => void;
  onDelete: (id: string, name: string) => void;
};

export function FormulaCriterionRow(props: Props) {
  const { criterion, index, isEditing, isDefault, onNameChange, onWeightChange, onDelete } = props;
  const isInvalid = Boolean(criterion.isInvalid) && isEditing;

  return (
    <div
      className={cn(
        'flex items-center justify-between px-4 py-3 border-b border-black/5',
        index % 2 === 0 ? 'bg-[#d9d9d9]' : 'bg-[#e6e6e6]',
        isInvalid && 'border border-danger',
      )}
    >
      {isEditing && !isDefault ? (
        <div className="flex flex-1 items-center gap-2">
          <input
            type="text"
            value={criterion.nome}
            onChange={(e) => onNameChange(criterion.id, e.target.value)}
            placeholder="Nome do critério"
            className="bg-transparent text-sm font-bold text-brand-900 border-none outline-none flex-1 placeholder:text-brand-900/40"
          />
          <button
            onClick={() => onDelete(criterion.id, criterion.nome)}
            className="p-1 text-danger hover:bg-danger/10 rounded-md"
          >
            <TrashIcon className="size-5" />
          </button>
        </div>
      ) : (
        <span className="text-sm font-bold text-brand-900 flex-1 truncate pr-2">
          {criterion.nome}
        </span>
      )}
      <div className="flex items-center justify-center bg-black/10 rounded-full px-3 py-1 min-w-[48px]">
        {isEditing ? (
          <input
            type="number"
            min="0"
            max="10"
            step="0.5"
            value={criterion.peso}
            onChange={(e) => onWeightChange(criterion.id, e.target.value)}
            className="bg-transparent text-sm font-bold text-brand-900 w-12 text-center border-none outline-none p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
        ) : (
          <span className="text-sm font-bold text-brand-900">{criterion.peso}</span>
        )}
      </div>
    </div>
  );
}
