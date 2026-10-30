import type { EvaluationCriterion } from '@/types/evaluation';

type EvaluationFinalScoreProps = {
  criteria: EvaluationCriterion[];
  scores: Record<string, number>;
  bonus?: number | null;
  studentId?: string;
};

export function EvaluationFinalScore({ criteria, scores, bonus }: EvaluationFinalScoreProps) {
  const totalWeight = criteria.reduce((sum, c) => sum + c.peso, 0);
  if (totalWeight <= 0) return null;

  const weightedSum = criteria.reduce((sum, c) => {
    const score = scores[c.id] ?? 0;
    return sum + score * c.peso;
  }, 0);

  const criteriaAverage = weightedSum / totalWeight;
  let finalScore = criteriaAverage;

  if (bonus !== undefined && bonus !== null) {
    finalScore = (criteriaAverage * 7 + bonus * 3) / 10;
  }

  const roundedScore = Math.round((finalScore + Number.EPSILON) * 10) / 10;

  return (
    <>
      {bonus !== undefined && bonus !== null && (
        <div className="mt-4 flex items-center justify-between border-t border-black/10 pt-4">
          <span className="text-sm font-semibold text-brand-900">Nota de cargo na sessão</span>
          <span className="text-sm font-bold text-ink">{bonus.toFixed(1)}</span>
        </div>
      )}
      <div className="mt-4 flex items-center justify-between border-t border-black/10 pt-4">
        <span className="text-sm font-bold text-brand-900">Nota final da sessão</span>
        <div className="flex items-center gap-1.5">
          <span className="rounded-xl bg-brand-900 px-3.5 py-1 text-base font-bold text-white shadow-xs">
            {roundedScore.toFixed(1)}
          </span>
          <span className="text-xs text-muted">/ 10</span>
        </div>
      </div>
    </>
  );
}
