import { useState } from 'react';

type Props = {
  value: number;
  onChange: (val: number) => void;
  label: string;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
};

function formatWithComma(val: number): string {
  return val.toFixed(1).replace('.', ',');
}

function clampScore(raw: string, min: number, max: number): number {
  const parsed = parseFloat(raw.replace(',', '.'));
  if (Number.isNaN(parsed) || parsed < min) return min;
  if (parsed > max) return max;
  return Math.round(parsed * 10) / 10;
}

function parseAndEmit(text: string, min: number, max: number, onChange: (v: number) => void) {
  const parsed = parseFloat(text.replace(',', '.'));
  if (!Number.isNaN(parsed) && parsed >= min && parsed <= max) {
    onChange(Math.round(parsed * 10) / 10);
  }
}

const INPUT_CLASS =
  'w-14 rounded-lg border border-transparent bg-transparent py-1 text-center text-base font-bold text-ink transition-colors hover:border-black/10 focus:border-brand-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-900 disabled:opacity-50';

function EditableScoreInput({
  value,
  onChange,
  label,
  min,
  max,
  disabled,
}: {
  value: number;
  onChange: (val: number) => void;
  label: string;
  min: number;
  max: number;
  disabled?: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [raw, setRaw] = useState('');

  function handleFocus() {
    setIsEditing(true);
    setRaw(formatWithComma(value));
  }

  function handleBlur() {
    setIsEditing(false);
    onChange(clampScore(raw, min, max));
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const text = e.target.value.replace('.', ',');
    if (!/^\d*(,\d{0,1})?$/.test(text)) return;
    setRaw(text);
    parseAndEmit(text, min, max, onChange);
  }

  return (
    <input
      type="text"
      inputMode="decimal"
      disabled={disabled}
      value={isEditing ? raw : formatWithComma(value)}
      onFocus={handleFocus}
      onChange={handleChange}
      onBlur={handleBlur}
      aria-label={`Nota de ${label}`}
      className={INPUT_CLASS}
    />
  );
}

export function ScoreStepper({
  value,
  onChange,
  label,
  min = 0,
  max = 10,
  step = 1,
  disabled = false,
}: Props) {
  const handleStep = (delta: number) => {
    const next = Math.min(max, Math.max(min, Math.round((value + delta) * 10) / 10));
    onChange(next);
  };

  return (
    <div className="flex shrink-0 items-center gap-1 sm:gap-2">
      <button
        type="button"
        aria-label={`Diminuir nota de ${label}`}
        disabled={disabled || value <= min}
        onClick={() => handleStep(-step)}
        className="flex size-9 items-center justify-center rounded-xl border border-black/10 text-lg font-bold text-ink transition hover:bg-gray-50 active:scale-95 disabled:opacity-30 sm:size-10"
      >
        −
      </button>
      <EditableScoreInput
        value={value}
        onChange={onChange}
        label={label}
        min={min}
        max={max}
        disabled={disabled}
      />
      <button
        type="button"
        aria-label={`Aumentar nota de ${label}`}
        disabled={disabled || value >= max}
        onClick={() => handleStep(step)}
        className="flex size-9 items-center justify-center rounded-xl border border-black/10 text-lg font-bold text-brand-900 transition hover:bg-gray-50 active:scale-95 disabled:opacity-30 sm:size-10"
      >
        +
      </button>
    </div>
  );
}
