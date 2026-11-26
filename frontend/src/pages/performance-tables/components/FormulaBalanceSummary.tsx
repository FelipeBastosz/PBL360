import { CheckIcon } from '@heroicons/react/24/outline';
import {
  formatCriterionWeight,
  isBalancedWeight,
  sumCriterionWeights,
} from '@/utils/criterionWeight';

type Props = {
  totalWeight: number;
};

export function FormulaBalanceSummary({ totalWeight }: Props) {
  const roundedTotal = sumCriterionWeights([totalWeight]);
  const isBalanced = isBalancedWeight(totalWeight);
  const formattedWeight = formatCriterionWeight(roundedTotal);

  return (
    <div role="status" aria-live="polite" className="flex flex-col gap-1 px-2">
      <div className="flex items-center justify-between text-sm font-bold">
        <span className={isBalanced ? 'text-ink' : 'text-danger'}>Soma dos pesos</span>
        <span
          className={`inline-flex items-center gap-1 ${
            isBalanced ? 'text-success' : 'text-danger'
          }`}
        >
          {isBalanced && <CheckIcon className="size-4 stroke-[2.5]" aria-hidden="true" />}
          <span>{formattedWeight} / 10</span>
        </span>
      </div>
      {isBalanced ? (
        <p className="inline-flex items-center gap-1 text-xs font-semibold text-success">
          <CheckIcon className="size-3.5 stroke-[2.5]" aria-hidden="true" />
          <span>Soma correta</span>
        </p>
      ) : (
        <p className="text-xs font-semibold text-danger">
          {roundedTotal > 10
            ? `A soma dos pesos ultrapassou 10 (total: ${formattedWeight}).`
            : `A soma dos pesos deve ser exatamente 10 (atual: ${formattedWeight}).`}
        </p>
      )}
    </div>
  );
}
