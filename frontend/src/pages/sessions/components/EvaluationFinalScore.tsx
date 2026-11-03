import type { EvaluationCriterion, EvaluationFormula } from '@/types/evaluation';
import { calculateSessionScore } from '@/utils/evaluationScore';

type EvaluationFinalScoreProps = {
  criteria: EvaluationCriterion[];
  scores: Record<string, number>;
  roleScore?: number | null;
  formula?: EvaluationFormula;
  hasRole?: boolean;
  bonus?: number | null;
};

export function EvaluationFinalScore({
  criteria,
  scores,
  roleScore,
  formula,
  hasRole,
  bonus,
}: EvaluationFinalScoreProps) {
  const totalWeight = criteria.reduce((sum, c) => sum + c.peso, 0);
  if (totalWeight <= 0) return null;

  const effectiveRoleScore = roleScore !== undefined ? roleScore : (bonus ?? null);
  const finalScore = calculateSessionScore({
    criteria,
    scores,
    roleScore: effectiveRoleScore,
    formula,
    hasRole,
  });

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
