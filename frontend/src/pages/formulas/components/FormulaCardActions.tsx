import { PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';
import { cn } from '@/utils/cn';

type ActionsProps = {
  isEditing: boolean;
  isDefault?: boolean;
  isCurrent?: boolean;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onApplyFormula: () => void;
  onEdit: () => void;
  onDeleteFormula: () => void;
};

function EditingActions({ onCancel, onSave }: { onCancel: () => void; onSave: () => void }) {
  return (
    <div className="flex items-center justify-between p-4 bg-[#e6e6e6]">
      <button
        onClick={onCancel}
        className="text-[#e29e9e] font-bold text-sm bg-[#f2d7d7] px-4 py-2 rounded-xl hover:bg-[#eed0d0] transition-colors"
      >
        Cancelar
      </button>
      <button
        onClick={onSave}
        className="bg-brand-900 text-white font-bold text-sm px-6 py-2 rounded-xl hover:bg-brand-700 transition-colors"
      >
        Salvar
      </button>
    </div>
  );
}

function ViewActions(props: Omit<ActionsProps, 'isEditing' | 'onCancelEdit' | 'onSaveEdit'>) {
  const { isDefault, isCurrent, onApplyFormula, onEdit, onDeleteFormula } = props;
  const applyClass = cn(
    'px-4 py-1.5 rounded-full text-xs font-bold',
    isCurrent ? 'bg-black/10 text-brand-900/50' : 'bg-black/20 text-brand-900',
  );

  return (
    <div className="flex items-center justify-between p-4 bg-[#e6e6e6]">
      <button onClick={onApplyFormula} disabled={isCurrent} className={applyClass}>
        {isCurrent ? 'Fórmula atual' : 'Aplicar formula'}
      </button>
      <div className="flex items-center gap-2">
        <button onClick={onEdit} className="p-1.5 text-brand-900 hover:bg-black/5 rounded-md">
          <PencilSquareIcon className="size-6" strokeWidth={2} />
        </button>
        {!isDefault && (
          <button
            onClick={onDeleteFormula}
            className="p-1.5 text-danger hover:bg-danger/10 rounded-md"
          >
            <TrashIcon className="size-6" strokeWidth={2} />
          </button>
        )}
      </div>
    </div>
  );
}

export function FormulaCardActions(props: ActionsProps) {
  if (props.isEditing) {
    return <EditingActions onCancel={props.onCancelEdit} onSave={props.onSaveEdit} />;
  }
  return <ViewActions {...props} />;
}
