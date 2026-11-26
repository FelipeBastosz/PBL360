import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import { parseCriterionWeight } from '@/utils/criterionWeight';

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
  errorMessage?: string;
};

type StepperProps = {
  canIncrement: boolean;
  canDecrement: boolean;
  onStep: (delta: number) => void;
};

function WeightStepperButtons({ canIncrement, canDecrement, onStep }: StepperProps) {
  return (
    <div className="absolute right-1 flex flex-col items-center justify-center">
      <button
        type="button"
        tabIndex={-1}
        aria-label="Aumentar peso"
        disabled={!canIncrement}
        onClick={() => onStep(1)}
        className="flex size-6 items-center justify-center text-muted transition hover:text-brand-accent active:scale-90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ChevronUpIcon className="size-3.5 stroke-[2.5]" />
      </button>
      <button
        type="button"
        tabIndex={-1}
        aria-label="Diminuir peso"
        disabled={!canDecrement}
        onClick={() => onStep(-1)}
        className="flex size-6 items-center justify-center text-muted transition hover:text-brand-accent active:scale-90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ChevronDownIcon className="size-3.5 stroke-[2.5]" />
      </button>
    </div>
  );
}

type InputProps = {
  id: string;
  value: string;
  disabled: boolean;
  isInvalid: boolean;
  numericValue: number | null;
  placeholder?: string;
  onChange: (v: string) => void;
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>;
  children: React.ReactNode;
};

function WeightInputBox(props: InputProps) {
  const {
    id,
    value,
    disabled,
    isInvalid,
    numericValue,
    placeholder,
    onChange,
    onKeyDown,
    children,
  } = props;
  const disabledClass = disabled ? 'bg-subtle opacity-60 cursor-not-allowed border-border' : '';
  const borderClass = isInvalid ? 'border-danger' : 'border-border';

  return (
    <div className="relative flex items-center">
      <input
        id={id}
        type="text"
        inputMode="decimal"
        role="spinbutton"
        aria-valuemin={0}
        aria-valuemax={10}
        aria-valuenow={numericValue ?? undefined}
        aria-invalid={isInvalid || undefined}
        aria-describedby={isInvalid ? `${id}-error` : undefined}
        disabled={disabled}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        className={`h-10 w-full rounded-[10px] border pl-3 pr-8 text-sm text-ink ${disabledClass} ${borderClass}`}
      />
      {children}
    </div>
  );
}

export function CriterionWeightField(props: Props) {
  const {
    id,
    label,
    value,
    onChange,
    onStep,
    onKeyDown,
    placeholder,
    disabled = false,
    hasError = false,
    errorMessage,
  } = props;
  const numericValue = parseCriterionWeight(value);
  const isInvalid = Boolean(hasError || errorMessage);
  const canIncrement = !disabled && (numericValue === null || numericValue < 10);
  const canDecrement = !disabled && numericValue !== null && numericValue > 0;

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-xs font-semibold text-brand-accent">
        {label}
      </label>
      <WeightInputBox
        id={id}
        value={value}
        disabled={disabled}
        isInvalid={isInvalid}
        numericValue={numericValue}
        placeholder={placeholder}
        onChange={onChange}
        onKeyDown={onKeyDown}
      >
        <WeightStepperButtons
          canIncrement={canIncrement}
          canDecrement={canDecrement}
          onStep={onStep}
        />
      </WeightInputBox>
      {errorMessage && (
        <p id={`${id}-error`} role="alert" className="text-xs font-semibold text-danger">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
