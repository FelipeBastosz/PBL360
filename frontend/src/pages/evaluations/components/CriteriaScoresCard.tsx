import { useState } from 'react';
import type { EvaluationCriterion, EvaluationFormula } from '@/types/evaluation';
import type { SessionRole } from '@/types/session';
import { calculateSessionScore, getRolePercentage } from '@/utils/evaluationScore';
import { roleLabel } from '@/utils/sessionRoles';
import { formatGrade } from '@/utils/formatGrade';

type Props = {
  studentName: string;
  papel?: SessionRole | string | null;
  formula?: EvaluationFormula;
  criteria: EvaluationCriterion[];
  scores: Record<string, number>;
  bonus?: number | null;
  notaCargo?: number | null;
  onScoreChange: (criterioId: string, nextScore: number) => void;
  onCargoScoreChange?: (nextScore: number) => void;
};

function FinalScoreRow({ score }: { score: number }) {
  return (
    <div className="mt-4 flex items-center justify-between border-t border-black/10 pt-4">
      <span className="text-sm font-bold text-brand-900">Nota final da sessão</span>
      <div className="flex items-center gap-1.5">
        <span className="rounded-xl bg-brand-900 px-3.5 py-1 text-base font-bold text-white shadow-xs">
          {formatGrade(score)}
        </span>
        <span className="text-xs text-muted">/ 10</span>
      </div>
    </div>
  );
}

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
    setRaw(formatGrade(value));
  }

  function handleBlur() {
    setIsEditing(false);
    const parsed = parseFloat(raw.replace(',', '.'));
    if (!isNaN(parsed)) {
      const clamped = Math.min(10, Math.max(0, parsed));
      onChange(Math.round(clamped * 10) / 10);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const text = e.target.value;
    setRaw(text);
    const parsed = parseFloat(text.replace(',', '.'));
    if (!isNaN(parsed) && parsed >= 0 && parsed <= 10) {
      onChange(Math.round(parsed * 10) / 10);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  }

  return (
    <input
      type="text"
      inputMode="decimal"
      aria-label={`Nota de ${label}`}
      value={isEditing ? raw : String(value)}
      value={isEditing ? raw : formatGrade(value)}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      className="w-14 rounded-xl border border-black/10 bg-surface/50 py-1.5 text-center text-base font-bold text-brand-900 transition focus:border-brand-900 focus:bg-white focus:outline-hidden"
    />
  );
}

function ScoreRow({
  label,
  subtitle,
  score,
  onChange,
}: {
  label: string;
  subtitle: string;
  score: number;
  onChange: (val: number) => void;
}) {
  function handleStep(delta: number) {
    const next = Math.min(10, Math.max(0, Math.round((score + delta) * 10) / 10));
    onChange(next);
  }

  return (
    <div className="flex items-center justify-between border-b border-black/5 py-3.5 last:border-b-0">
      <div className="flex flex-col pr-4">
        <span className="text-sm font-semibold text-ink">{label}</span>
        <span className="text-xs text-muted">{subtitle}</span>
      </div>
      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        <button
          type="button"
          aria-label={`Diminuir nota de ${label}`}
          disabled={score <= 0}
          onClick={() => handleStep(-1)}
          className="flex size-9 items-center justify-center rounded-xl border border-black/10 text-lg font-bold text-ink transition hover:bg-gray-50 active:scale-95 disabled:opacity-30 sm:size-10"
        >
          −
        </button>
        <EditableScoreInput value={score} onChange={onChange} label={label} />
        <button
          type="button"
          aria-label={`Aumentar nota de ${label}`}
          disabled={score >= 10}
          onClick={() => handleStep(1)}
          className="flex size-9 items-center justify-center rounded-xl border border-black/10 text-lg font-bold text-brand-900 transition hover:bg-gray-50 active:scale-95 disabled:opacity-30 sm:size-10"
        >
          +
        </button>
      </div>
    </div>
  );
}

function CardHeader({
  studentName,
  papel,
}: {
  studentName: string;
  papel?: SessionRole | string | null;
}) {
  return (
    <div className="flex flex-col">
      <h2 className="text-base font-bold break-words text-brand-900">
        Notas do aluno: {studentName}
      </h2>
      {papel && (
        <span className="text-xs font-semibold text-warning">
          Papel: {roleLabel(papel as SessionRole)}
        </span>
      )}
    </div>
  );
}

export function CriteriaScoresCard({
  studentName,
  papel,
  formula,
  criteria,
  scores,
  bonus,
  notaCargo,
  onScoreChange,
  onCargoScoreChange,
}: Props) {
  const effectiveCargoScore = notaCargo ?? bonus;
  const hasRole = Boolean(papel);
  const rolePercentage = getRolePercentage(formula);
  const finalScore = calculateSessionScore({
    criteria,
    scores,
    roleScore: effectiveCargoScore,
    formula,
    hasRole,
  });

  return (
    <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
      <CardHeader studentName={studentName} papel={papel} />
      <div className="mt-3 flex flex-col">
        {criteria.map((criterion) => (
          <ScoreRow
            key={criterion.id}
            label={criterion.nome}
            subtitle={`Peso ${criterion.peso.toFixed(1).replace('.', ',')}`}
            score={scores[criterion.id] ?? 0}
            onChange={(val) => onScoreChange(criterion.id, val)}
          />
        ))}
        {hasRole && onCargoScoreChange && (
          <ScoreRow
            label={`Desempenho como ${roleLabel(papel as SessionRole)}`}
            subtitle={`Peso na fórmula (${rolePercentage}%)`}
            score={effectiveCargoScore ?? 0}
            onChange={onCargoScoreChange}
          />
        )}
      </div>
      <FinalScoreRow score={finalScore} />
    </div>
  );
}
