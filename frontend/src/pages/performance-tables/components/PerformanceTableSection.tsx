import { CARD_GRID_CLASS } from '@/components/ui/cardStyles';
import type { PerformanceTableSummary } from '@/types/performanceTable';
import type { ApplyTarget } from '@/utils/navigationState';
import { PerformanceTableCard } from './PerformanceTableCard';

type SectionProps = {
  title: string;
  tables: PerformanceTableSummary[];
  currentUserId?: string;
  target: ApplyTarget | null;
  checkIsApplied: (table: PerformanceTableSummary) => boolean;
  onOpenDelete: (table: PerformanceTableSummary) => void;
};

export function PerformanceTableSection({
  title,
  tables,
  currentUserId,
  target,
  checkIsApplied,
  onOpenDelete,
}: SectionProps) {
  if (tables.length === 0) return null;

  return (
    <section className="mt-6 flex flex-col gap-3">
      <h2 className="text-xs font-bold uppercase tracking-widest text-muted">
        {title} · {tables.length}
      </h2>
      <div className={CARD_GRID_CLASS}>
        {tables.map((table) => {
          const isAuthor = Boolean(currentUserId && table.autor?.id === currentUserId);
          return (
            <PerformanceTableCard
              key={table.id}
              table={table}
              isApplied={checkIsApplied(table)}
              target={target}
              canDelete={isAuthor}
              onDelete={() => onOpenDelete(table)}
            />
          );
        })}
      </div>
    </section>
  );
}
