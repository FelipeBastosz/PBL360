import { ScoreStepper } from '@/components/ui/ScoreStepper';
import type { FinalGradeSessionWeight } from '@/types/formula';
import { cn } from '@/utils/cn';

type Props = {
  session: FinalGradeSessionWeight;
  percentage: string;
  method?: string;
  onChange: (newWeight: number) => void;
};

function getMethodBadgeClass(method?: string) {
  if (method === 'Autoavaliação') {
    return 'bg-emerald-50 text-emerald-800 border border-emerald-200/70';
  }
  if (method === 'Avaliação por Pares') {
    return 'bg-violet-50 text-violet-800 border border-violet-200/70';
  }
  return 'bg-blue-50 text-blue-800 border border-blue-200/70';
}

export function SessionWeightRow({
  session,
  percentage,
  method = 'Avaliação do Tutor',
  onChange,
}: Props) {
  return (
    <div className="flex items-center justify-between border-b border-black/5 p-4 last:border-b-0 sm:p-5">
      <div className="flex flex-col pr-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-base font-bold text-brand-900">{session.rotulo}</span>
          <span
            className={cn(
              'rounded-full px-2.5 py-0.5 text-[11px] font-bold shadow-2xs',
              getMethodBadgeClass(method),
            )}
          >
            {method}
          </span>
        </div>
        <span className="mt-0.5 text-xs font-semibold text-muted">{percentage} da nota</span>
      </div>
      <ScoreStepper
        value={session.peso}
        onChange={onChange}
        label={session.rotulo}
        min={1}
        max={10}
        step={1}
      />
    </div>
  );
}
