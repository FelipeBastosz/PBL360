import { cn } from '@/utils/cn';

type HideNamesToggleProps = {
  hideNames: boolean;
  onChange: (value: boolean) => void;
};

export function HideNamesToggle({ hideNames, onChange }: HideNamesToggleProps) {
  return (
    <div className="mt-[4px] mb-[7px] flex justify-end pr-[6.6px] sm:pr-0">
      <label className="flex cursor-pointer items-center gap-[8.5px] select-none">
        <span className="text-[13px] leading-6 font-semibold text-[#322A7D]">Ocultar nomes</span>
        <button
          type="button"
          role="switch"
          aria-checked={hideNames}
          aria-label="Ocultar nomes"
          onClick={() => onChange(!hideNames)}
          className={cn(
            'relative h-6 w-11 shrink-0 rounded-full shadow-[inset_0_2px_4px_rgb(0_0_0/0.05)] transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-900',
            hideNames ? 'bg-brand-900' : 'bg-[#D1D5DB]',
          )}
        >
          <span
            className={cn(
              'absolute top-1 left-1 size-4 rounded-full bg-white shadow-[0_1px_3px_rgb(0_0_0/0.1),0_1px_2px_-1px_rgb(0_0_0/0.1)] transition-transform duration-200',
              hideNames && 'translate-x-5',
            )}
          />
        </button>
      </label>
    </div>
  );
}
