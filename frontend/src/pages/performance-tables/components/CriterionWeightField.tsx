import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

type Props = {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  onStep: (delta: number) => void;
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>;
  placeholder?: string;
  disabled?: boolean;
  hasError?: boolean;
};

export function CriterionWeightField({
  id,
  label,
  value,
  onChange,
  onStep,
  onKeyDown,
  placeholder,
  disabled = false,
  hasError,
}: Props) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-xs font-semibold text-brand-900">
        {label}
      </label>
      <div className="relative flex items-center">
        <input
          id={id}
          type="text"
          inputMode="decimal"
          min={0}
          max={10}
          step={1}
          disabled={disabled}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          className={`h-10 w-full rounded-[10px] border pl-3 pr-8 text-sm text-ink ${
            disabled ? 'bg-black/5 opacity-60 cursor-not-allowed border-black/10' : ''
          } ${hasError ? 'border-danger' : 'border-black/10'}`}
        />
        <div className="absolute right-1.5 flex flex-col items-center justify-center">
          <button
            type="button"
            tabIndex={-1}
            aria-label="Incrementar"
            disabled={disabled}
            onClick={() => onStep(1)}
            className="flex size-4 items-center justify-center text-muted transition hover:text-brand-900 active:scale-90 disabled:opacity-40"
          >
            <ChevronUpIcon className="size-3.5 stroke-[2.5]" />
          </button>
          <button
            type="button"
            tabIndex={-1}
            aria-label="Decrementar"
            disabled={disabled}
            onClick={() => onStep(-1)}
            className="flex size-4 items-center justify-center text-muted transition hover:text-brand-900 active:scale-90 disabled:opacity-40"
          >
            <ChevronDownIcon className="size-3.5 stroke-[2.5]" />
          </button>
        </div>
      </div>
    </div>
  );
}
