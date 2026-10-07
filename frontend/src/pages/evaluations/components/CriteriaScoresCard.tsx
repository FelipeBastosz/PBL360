import { useState } from 'react';
import type { EvaluationCriterion } from '@/types/evaluation';

type Props = {
  studentName: string;
  criteria: EvaluationCriterion[];
  scores: Record<string, number>;
  onScoreChange: (criterioId: string, nextScore: number) => void;
};

function EditableScoreInput({
  value,
  onChange,
  label,
}: {
  value: number;
  onChange: (val: number) => void;
  label: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [raw, setRaw] = useState('');

  function handleFocus() {
    setIsEditing(true);
    setRaw(String(value));
  }

  function handleBlur() {
    setIsEditing(false);
    const parsed = parseFloat(raw.replace(',', '.'));
    if (Number.isNaN(parsed) || parsed < 0) {
      onChange(0);
    } else if (parsed > 10) {
      onChange(10);
    } else {
      onChange(Math.round(parsed * 10) / 10);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.target.value;
    setRaw(input);
    const parsed = parseFloat(input.replace(',', '.'));
    if (!Number.isNaN(parsed) && parsed >= 0 && parsed <= 10) {
      onChange(Math.round(parsed * 10) / 10);
    }
  }

  return (
    <input
      type="text"
      inputMode="decimal"
      value={isEditing ? raw : String(value)}
      onFocus={handleFocus}
      onChange={handleChange}
      onBlur={handleBlur}
      aria-label={`Nota de ${label}`}
      className="w-12 rounded-lg border border-transparent bg-transparent py-1 text-center text-base font-bold text-ink transition-colors hover:border-black/10 focus:border-brand-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-900"
    />
  );
}

function CriterionRow({
  criterion,
  score,
  onChange,
}: {
  criterion: EvaluationCriterion;
  score: number;
  onChange: (val: number) => void;
}) {
  const handleStep = (delta: number) => {
    const next = Math.min(10, Math.max(0, Math.round((score + delta) * 10) / 10));
    onChange(next);
  };

  return (
    <div className="flex items-center justify-between border-b border-black/5 py-3.5 last:border-b-0">
      <div className="flex flex-col pr-2">
        <span className="text-sm font-semibold text-brand-900">{criterion.nome}</span>
        <span className="text-xs text-muted">
          Peso {criterion.peso.toFixed(1).replace('.', ',')}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label={`Diminuir nota de ${criterion.nome}`}
          disabled={score <= 0}
          onClick={() => handleStep(-1)}
          className="flex size-10 items-center justify-center rounded-xl border border-black/10 text-lg font-bold text-ink transition hover:bg-gray-50 active:scale-95 disabled:opacity-30"
        >
          −
        </button>
        <EditableScoreInput value={score} onChange={onChange} label={criterion.nome} />
        <button
          type="button"
          aria-label={`Aumentar nota de ${criterion.nome}`}
          disabled={score >= 10}
          onClick={() => handleStep(1)}
          className="flex size-10 items-center justify-center rounded-xl border border-black/10 text-lg font-bold text-brand-900 transition hover:bg-gray-50 active:scale-95 disabled:opacity-30"
        >
          +
        </button>
      </div>
    </div>
  );
}

export function CriteriaScoresCard({ studentName, criteria, scores, onScoreChange }: Props) {
  return (
    <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
      <h2 className="text-base font-bold text-brand-900">Notas do aluno: {studentName}</h2>
      <div className="mt-3 flex flex-col">
        {criteria.map((criterion) => (
          <CriterionRow
            key={criterion.id}
            criterion={criterion}
            score={scores[criterion.id] ?? 0}
            onChange={(val) => onScoreChange(criterion.id, val)}
          />
        ))}
      </div>
    </div>
  );
}
