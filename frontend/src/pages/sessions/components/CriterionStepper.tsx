import type { EvaluationCriterion } from '@/types/evaluation';

type CriterionStepperProps = {
  criterion: EvaluationCriterion;
  score: number;
  disabled: boolean;
  onChange: (id: string, newScore: number) => void;
};

export function CriterionStepper({ criterion, score, disabled, onChange }: CriterionStepperProps) {
  const max = criterion.notaMaxima ?? 10;
  return (
    <div
      role="group"
      aria-label={criterion.nome}
      className="flex items-center justify-between border-b border-black/5 py-4 last:border-0"
    >
      <div className="flex flex-col">
        <span className="font-semibold text-brand-900">{criterion.nome}</span>
        <span className="text-sm text-muted">
          Peso {criterion.peso.toLocaleString('pt-BR', { minimumFractionDigits: 1 })}
        </span>
      </div>
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => onChange(criterion.id, Math.max(0, score - 1))}
          disabled={disabled || score <= 0}
          className="flex size-10 items-center justify-center rounded-lg border border-black/10 bg-white text-brand-900 active:bg-surface disabled:opacity-50"
        >
          <span className="text-xl leading-none">&minus;</span>
        </button>
        <span className="w-6 text-center text-lg font-semibold text-ink">{score}</span>
        <button
          type="button"
          onClick={() => onChange(criterion.id, Math.min(max, score + 1))}
          disabled={disabled || score >= max}
          className="flex size-10 items-center justify-center rounded-lg border border-black/10 bg-white text-brand-900 active:bg-surface disabled:opacity-50"
        >
          <span className="text-xl leading-none">+</span>
        </button>
      </div>
    </div>
  );
}
