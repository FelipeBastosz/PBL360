import type { EvaluationCriterion } from '@/types/evaluation';

type EvaluationFinalScoreProps = {
  criteria: EvaluationCriterion[];
  scores: Record<string, number>;
  bonus?: number | null;
};

export function EvaluationFinalScore({ criteria, scores, bonus }: EvaluationFinalScoreProps) {
  const allItems = [
    ...criteria.map((c) => ({ weight: c.peso, score: scores[c.id] ?? 0 })),
    ...(bonus !== undefined && bonus !== null ? [{ weight: 3.0, score: bonus }] : []),
  ];

  const totalWeight = allItems.reduce((sum, item) => sum + item.weight, 0);
  if (totalWeight <= 0) return null;

  const weightedSum = allItems.reduce((sum, item) => sum + item.score * item.weight, 0);
  const finalScore = Math.round((weightedSum / totalWeight + Number.EPSILON) * 10) / 10;

  return (
    <div className="mt-4 flex items-center justify-between border-t border-black/10 pt-4">
      <span className="text-sm font-bold text-brand-900">Nota final da sessão</span>
      <div className="flex items-center gap-1.5">
        <span className="rounded-xl bg-brand-900 px-3.5 py-1 text-base font-bold text-white shadow-xs">
          {finalScore.toFixed(1)}
        </span>
        <span className="text-xs text-muted">/ 10</span>
      </div>
    </div>
  );
}
