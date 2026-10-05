import type { ComponentType, SVGProps } from 'react';
import { CheckIcon, ClockIcon, LockClosedIcon, XMarkIcon } from '@heroicons/react/24/outline';
import type { RollCallTotals } from '@/types/session';
import { cn } from '@/utils/cn';

type Counter = {
  key: keyof RollCallTotals;
  label: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  className: string;
};

const COUNTERS: Counter[] = [
  { key: 'presentes', label: 'Presentes', Icon: CheckIcon, className: 'text-success' },
  { key: 'atrasados', label: 'Atrasados', Icon: ClockIcon, className: 'text-warning' },
  { key: 'justificados', label: 'Justificados', Icon: LockClosedIcon, className: 'text-brand-900' },
  { key: 'ausentes', label: 'Ausentes', Icon: XMarkIcon, className: 'text-danger' },
];

export function AttendanceCounters({ totals }: { totals: RollCallTotals }) {
  return (
    <dl className="grid grid-cols-4 gap-2">
      {COUNTERS.map(({ key, label, Icon, className }) => (
        <div
          key={key}
          className="flex flex-col items-center rounded-xl border border-black/10 bg-white px-1 py-2 shadow-[0_1px_2px_rgb(16_33_76/0.06)]"
        >
          <dd
            key={totals[key]}
            className={cn('text-2xl leading-none font-bold animate-pop-in', className)}
          >
            {totals[key]}
          </dd>
          <dt className="mt-1 flex items-center gap-0.5 text-[0.6875rem] text-muted">
            <Icon className={cn('size-3 shrink-0', className)} strokeWidth={2.5} aria-hidden />
            <span className="truncate">{label}</span>
          </dt>
        </div>
      ))}
    </dl>
  );
}
