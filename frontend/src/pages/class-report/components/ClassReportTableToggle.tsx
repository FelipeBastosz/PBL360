import { cn } from '@/utils/cn';

type ClassReportTableToggleProps = {
  hideNames: boolean;
  onToggleHideNames: (val: boolean) => void;
};

export function ClassReportTableToggle({
  hideNames,
  onToggleHideNames,
}: ClassReportTableToggleProps) {
  return (
    <div className="flex items-center justify-end pb-4">
      <label
        htmlFor="toggle-hide-names"
        className="flex cursor-pointer select-none items-center gap-3 text-sm font-medium text-ink"
      >
        <span>Ocultar nomes</span>
        <button
          id="toggle-hide-names"
          type="button"
          role="switch"
          aria-checked={hideNames}
          aria-label="Ocultar nomes"
          onClick={() => onToggleHideNames(!hideNames)}
          className={cn(
            'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-2 focus-visible:outline-brand-900',
            hideNames ? 'bg-brand-900' : 'bg-black/20',
          )}
        >
          <span
            className={cn(
              'pointer-events-none inline-block size-5 rounded-full bg-white shadow-md transform transition duration-200 ease-in-out',
              hideNames ? 'translate-x-5' : 'translate-x-0',
            )}
          />
        </button>
      </label>
    </div>
  );
}
