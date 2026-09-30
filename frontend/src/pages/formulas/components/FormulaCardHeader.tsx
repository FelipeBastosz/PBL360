import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import { cn } from '@/utils/cn';

type Props = {
  displayTitle?: string;
  draftName?: string;
  isExpanded: boolean;
  isEditing: boolean;
  isDefault?: boolean;
  isCurrent?: boolean;
  onExpand: () => void;
  onNameChange: (val: string) => void;
};

export function FormulaCardHeader(props: Props) {
  const {
    displayTitle,
    draftName,
    isExpanded,
    isEditing,
    isDefault,
    isCurrent,
    onExpand,
    onNameChange,
  } = props;
  const HeaderIcon = isExpanded ? ChevronUpIcon : ChevronDownIcon;

  return (
    <div
      className={cn(
        'flex items-center justify-between p-4 cursor-pointer select-none',
        isEditing && 'bg-surface',
      )}
      onClick={!isEditing ? onExpand : undefined}
    >
      {isEditing && !isDefault ? (
        <input
          type="text"
          value={draftName || ''}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Nome da fórmula"
          className="flex-1 bg-black/5 rounded-lg px-3 py-1.5 text-base font-bold text-brand-900 border-none outline-none"
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <h3 className="text-base font-bold text-brand-900 flex-1 truncate pr-2">
          {displayTitle || 'Nova Fórmula'}
        </h3>
      )}
      <div className="flex items-center gap-3">
        {isCurrent && !isEditing && (
          <span className="bg-[#e8f7ec] text-[#2c7a4b] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
            Atual
          </span>
        )}
        <HeaderIcon className={cn('size-5 text-ink', isEditing && isDefault && 'opacity-50')} />
      </div>
    </div>
  );
}
