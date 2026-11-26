import type { PerformanceTimelineSession } from '@/types/studentPerformance';
import { cn } from '@/utils/cn';
import { formatDayMonth } from '@/utils/date';
import type { ChartPoint, ProblemBand } from '@/utils/studentPerformance';

const Y_TICKS = [
  { label: '10', top: 0 },
  { label: '5', top: 50 },
  { label: '0', top: 100 },
];

const percent = (value: number) => `${value}%`;

const bandStyle = (band: ProblemBand, total: number) => ({
  left: percent((band.start / total) * 100),
  width: percent((band.size / total) * 100),
});

export function YAxis() {
  return (
    <div aria-hidden className="relative h-40 w-7 shrink-0">
      {Y_TICKS.map((tick) => (
        <span
          key={tick.label}
          style={{ top: percent(tick.top) }}
          className="absolute right-1.5 -translate-y-1/2 text-[10px] text-muted"
        >
          {tick.label}
        </span>
      ))}
    </div>
  );
}

export function GridLines() {
  return (
    <>
      {Y_TICKS.map((tick) => (
        <span
          key={tick.label}
          aria-hidden
          style={{ top: percent(tick.top) }}
          className={cn('absolute inset-x-0 h-px', tick.top === 100 ? 'bg-black/25' : 'bg-black/5')}
        />
      ))}
    </>
  );
}

export function ProblemBands({ bands, total }: { bands: ProblemBand[]; total: number }) {
  return (
    <>
      {bands.map((band, index) => (
        <span
          key={`${band.problemId}-${band.start}`}
          aria-hidden
          style={bandStyle(band, total)}
          className={cn('absolute -top-1.5 bottom-0', index % 2 === 1 && 'bg-surface')}
        />
      ))}
    </>
  );
}

export function LinePath({ path }: { path: string }) {
  if (!path) return null;
  return (
    <svg
      aria-hidden
      viewBox="0 0 1000 100"
      preserveAspectRatio="none"
      className="absolute inset-0 size-full overflow-visible text-brand-900"
    >
      <path
        d={path}
        fill="none"
        stroke="currentColor"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export function SelectionGuide({ point }: { point?: ChartPoint }) {
  if (!point) return null;
  return (
    <span
      aria-hidden
      style={{ left: percent(point.x) }}
      className="absolute -top-1.5 bottom-0 border-l-[1.5px] border-brand-900/30"
    />
  );
}

type XAxisProps = {
  sessions: PerformanceTimelineSession[];
  points: ChartPoint[];
  selectedIndex: number;
};

export function XAxis({ sessions, points, selectedIndex }: XAxisProps) {
  return (
    <div aria-hidden className="relative ml-7 h-7">
      {points.map((point, index) => (
        <span
          key={point.id}
          style={{ left: percent(point.x) }}
          className={cn(
            'absolute top-1.5 -translate-x-1/2 text-[10px] whitespace-nowrap',
            index === selectedIndex ? 'font-extrabold text-brand-900' : 'font-semibold text-muted',
          )}
        >
          {formatDayMonth(sessions[index].data)}
        </span>
      ))}
    </div>
  );
}

export function BandLabels({ bands, total }: { bands: ProblemBand[]; total: number }) {
  return (
    <div aria-hidden className="relative ml-7 h-5 border-t border-black/10">
      {bands.map((band) => (
        <span
          key={`${band.problemId}-${band.start}`}
          style={bandStyle(band, total)}
          title={band.title}
          className="absolute top-1 truncate px-1 text-center text-[10px] font-bold text-brand-900"
        >
          {band.title}
        </span>
      ))}
    </div>
  );
}
