import type { PerformanceTable, PerformanceTableSummary } from '@/types/performanceTable';
import type { FormulasManager } from '../hooks/useFormulasManager';
import { FormulaSummaryItem } from './FormulaSummaryItem';

type Props = {
  summaries: PerformanceTableSummary[];
  loadedDetails: Record<string, PerformanceTable>;
  manager: FormulasManager;
  onRemove: (id: string) => void;
  showSnackbar: (msg: string) => void;
};

export function FormulaCardsList({
  summaries,
  loadedDetails,
  manager,
  onRemove,
  showSnackbar,
}: Props) {
  return (
    <>
      {summaries.map((summary) => (
        <FormulaSummaryItem
          key={summary.id}
          summary={summary}
          full={loadedDetails[summary.id]}
          manager={manager}
          onRemove={onRemove}
          showSnackbar={showSnackbar}
        />
      ))}
    </>
  );
}
