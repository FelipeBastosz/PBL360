import { useState } from 'react';
import type { EvaluationCriterion } from '@/types/evaluation';
import { formatGrade } from '@/utils/formatGrade';

type CriterionStepperProps = {
  criterion: Pick<EvaluationCriterion, 'id' | 'nome' | 'peso'> & {
    notaMaxima?: number;
    ordem?: number;
  };
  score: number;
  disabled: boolean;
  onChange: (id: string, newScore: number) => void;
  subtitle?: string;
};

function EditableScoreInput({
  value,
  max,
  disabled,
  label,
  onChange,
}: {
  value: number;
  max: number;
  disabled: boolean;
  label: string;
  onChange: (val: number) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [raw, setRaw] = useState('');

  function handleBlur() {
    setIsEditing(false);
    const parsed = parseFloat(raw.replace(',', '.'));
    if (!isNaN(parsed)) {
      const clamped = Math.min(max, Math.max(0, parsed));
      onChange(Math.round(clamped * 10) / 10);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const text = e.target.value;
    setRaw(text);
    const parsed = parseFloat(text.replace(',', '.'));
    if (!isNaN(parsed) && parsed >= 0 && parsed <= max) {
      onChange(Math.round(parsed * 10) / 10);
    }
  }

  return (
    <input
      type="text"
      inputMode="decimal"
      aria-label={`Nota de ${label}`}
      disabled={disabled}
      value={isEditing ? raw : formatGrade(value)}
      onFocus={() => {
        setIsEditing(true);
        setRaw(formatGrade(value));
      }}
      onBlur={handleBlur}
      onChange={handleChange}
      onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
      className="w-14 rounded-xl border border-black/10 bg-surface/50 py-1.5 text-center text-base font-bold text-brand-900 transition focus:border-brand-900 focus:bg-white focus:outline-hidden disabled:cursor-not-allowed disabled:opacity-70"
    />
  );
}

function CriterionInfo({
  nome,
  peso,
  subtitle,
}: {
  nome: string;
  peso: number;
  subtitle?: string;
}) {
  return (
    <div className="flex min-w-0 flex-col pr-2">
      <span className="font-semibold break-words text-brand-900">{nome}</span>
      <span className="text-sm text-muted">{subtitle ?? `Peso ${formatGrade(peso)}`}</span>
    </div>
  );
}

function StepButton({
  symbol,
  disabled,
  onClick,
}: {
  symbol: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex size-9 items-center justify-center rounded-lg border border-black/10 bg-white text-xl leading-none text-brand-900 transition active:bg-surface disabled:opacity-40 sm:size-10"
    >
      {symbol}
    </button>
  );
}

export function CriterionStepper({
  criterion,
  score,
  disabled,
  onChange,
  subtitle,
}: CriterionStepperProps) {
  const max = criterion.notaMaxima ?? 10;

  function handleStep(delta: number) {
    const next = Math.min(max, Math.max(0, Math.round((score + delta) * 10) / 10));
    onChange(criterion.id, next);
  }

  return (
    <div
      role="group"
      aria-label={criterion.nome}
      className="flex items-center justify-between border-b border-black/5 py-4 last:border-0"
    >
      <CriterionInfo nome={criterion.nome} peso={criterion.peso} subtitle={subtitle} />
      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        <StepButton symbol="−" disabled={disabled || score <= 0} onClick={() => handleStep(-1)} />
        <EditableScoreInput
          value={score}
          max={max}
          disabled={disabled}
          label={criterion.nome}
          onChange={(val) => onChange(criterion.id, val)}
        />
        <StepButton symbol="+" disabled={disabled || score >= max} onClick={() => handleStep(1)} />
      </div>
    </div>
  );
}
