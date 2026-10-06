import { Sheet } from '@/components/ui/Sheet';
import type { FormulaComponent } from '@/types/formula';
import { componentKey, componentName } from '@/utils/formula';

type AddComponentSheetProps = {
  isOpen: boolean;
  title: string;
  options: FormulaComponent[];
  onClose: () => void;
  onPick: (component: FormulaComponent) => void;
};

export function AddComponentSheet({
  isOpen,
  title,
  options,
  onClose,
  onPick,
}: AddComponentSheetProps) {
  return (
    <Sheet isOpen={isOpen} title={title} onClose={onClose}>
      <ul className="flex flex-col gap-2 px-6 pb-6">
        {options.map((option) => (
          <li key={componentKey(option)}>
            <button
              type="button"
              onClick={() => onPick(option)}
              className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-left font-semibold text-ink transition-colors hover:bg-brand-50"
            >
              {componentName(option)}
            </button>
          </li>
        ))}
      </ul>
    </Sheet>
  );
}
