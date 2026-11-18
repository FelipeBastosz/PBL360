import { formatCriterionWeight } from '@/utils/criterionWeight';

type Props = {
  totalWeight: number;
};

export function FormulaBalanceSummary({ totalWeight }: Props) {
  const roundedTotal = Math.round((totalWeight + Number.EPSILON) * 10) / 10;
  const isBalanced = roundedTotal === 10;
  const formattedWeight = formatCriterionWeight(roundedTotal);

  return (
    <div className="flex flex-col gap-1 px-2">
      <div className="flex items-center justify-between text-sm font-bold">
        <span className={isBalanced ? 'text-ink' : 'text-danger'}>Soma dos pesos</span>
        <span className={isBalanced ? 'text-emerald-700' : 'text-danger'}>
          {formattedWeight} / 10
        </span>
      </div>
      {!isBalanced && (
        <p className="text-xs font-semibold text-danger">
          {roundedTotal > 10
            ? `A soma dos pesos ultrapassou 10 (total: ${formattedWeight}).`
            : `A soma dos pesos deve ser exatamente 10 (atual: ${formattedWeight}).`}
        </p>
      )}
    </div>
  );
}
