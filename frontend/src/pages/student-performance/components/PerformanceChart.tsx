import { type KeyboardEvent, type RefObject, useEffect, useRef } from 'react';
import type { StudentPerformanceSession } from '@/types/studentPerformance';
import { cn } from '@/utils/cn';
import { formatDate } from '@/utils/date';
import { formatGrade } from '@/utils/formatGrade';
import {
  type ChartPoint,
  toChartPoints,
  toLinePath,
  toProblemBands,
} from '@/utils/studentPerformance';
import {
  BandLabels,
  GridLines,
  LinePath,
  ProblemBands,
  SelectionGuide,
  XAxis,
  YAxis,
} from './ChartParts';

// Each session keeps a 44px touch target; once they no longer fit, the chart scrolls sideways.
const SESSION_WIDTH_PX = 44;
const Y_AXIS_WIDTH_PX = 28;

const KEY_STEPS: Record<string, (index: number, last: number) => number> = {
  ArrowLeft: (index) => index - 1,
  ArrowRight: (index) => index + 1,
  Home: () => 0,
  End: (_index, last) => last,
};

type PerformanceChartProps = {
  sessions: StudentPerformanceSession[];
  selectedIndex: number;
  onSelect: (index: number) => void;
};

const pointButton = (plot: RefObject<HTMLDivElement | null>, index: number) =>
  plot.current?.querySelector<HTMLButtonElement>(`[data-index="${index}"]`);

function pointLabel(session: StudentPerformanceSession) {
  const grade = session.nota === null ? 'sem nota' : `nota ${formatGrade(session.nota)}`;
  return `${session.problemaTitulo}, ${session.rotulo}, ${formatDate(session.data)}: ${grade}`;
}

export function PerformanceChart({ sessions, selectedIndex, onSelect }: PerformanceChartProps) {
  const plotRef = useRef<HTMLDivElement>(null);
  const points = toChartPoints(sessions);
  const bands = toProblemBands(sessions);
  const total = sessions.length;

  // The scrollbar is hidden, so the chart follows the selection on its own.
  useEffect(() => {
    pointButton(plotRef, selectedIndex)?.scrollIntoView?.({ block: 'nearest', inline: 'center' });
  }, [selectedIndex]);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = KEY_STEPS[event.key];
    if (!step) return;
    event.preventDefault();
    const next = Math.min(Math.max(step(selectedIndex, total - 1), 0), total - 1);
    onSelect(next);
    pointButton(plotRef, next)?.focus();
  };

  return (
    <section
      aria-label="Notas por sessão"
      className="rounded-2xl border border-black/5 bg-white p-3 shadow-[0_1px_2px_rgb(16_33_76/0.06)]"
    >
      <ChartHeader total={total} />
      <div className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div style={{ minWidth: Y_AXIS_WIDTH_PX + total * SESSION_WIDTH_PX }} className="pt-5 pr-2">
          <div className="flex">
            <YAxis />
            <div
              ref={plotRef}
              role="group"
              aria-label="Sessões no gráfico. Use as setas para navegar."
              onKeyDown={handleKeyDown}
              className="relative h-40 flex-1"
            >
              <ChartPlot {...{ sessions, points, selectedIndex, onSelect }} />
            </div>
          </div>
          <XAxis sessions={sessions} points={points} selectedIndex={selectedIndex} />
          <BandLabels bands={bands} total={total} />
        </div>
      </div>
    </section>
  );
}

type ChartPlotProps = PerformanceChartProps & { points: ChartPoint[] };

function ChartPlot({ sessions, points, selectedIndex, onSelect }: ChartPlotProps) {
  return (
    <>
      <ProblemBands bands={toProblemBands(sessions)} total={sessions.length} />
      <GridLines />
      <SelectionGuide point={points[selectedIndex]} />
      <LinePath path={toLinePath(points)} />
      {points.map((point, index) => (
        <ChartMark
          key={point.id}
          point={point}
          index={index}
          label={pointLabel(sessions[index])}
          isSelected={index === selectedIndex}
          onSelect={onSelect}
        />
      ))}
    </>
  );
}

function ChartHeader({ total }: { total: number }) {
  const scrollable = total > 6;
  return (
    <div className="flex items-baseline justify-between gap-2 px-0.5">
      <h2 className="text-sm font-bold text-ink">Notas por sessão</h2>
      <span className="text-xs text-muted">
        {total === 1 ? '1 sessão' : `${total} sessões`}
        {scrollable && ' · arraste para o lado'}
      </span>
    </div>
  );
}

type ChartMarkProps = {
  point: ChartPoint;
  index: number;
  label: string;
  isSelected: boolean;
  onSelect: (index: number) => void;
};

// A pending grade is a dashed column, never a point at zero.
function ChartMark({ point, index, label, isSelected, onSelect }: ChartMarkProps) {
  const isPending = point.y === null;
  return (
    <button
      type="button"
      data-index={index}
      aria-label={label}
      aria-pressed={isSelected}
      tabIndex={isSelected ? 0 : -1}
      onClick={() => onSelect(index)}
      style={{ left: `${point.x}%`, top: isPending ? '50%' : `${point.y}%` }}
      className={cn(
        'absolute z-10 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center focus-visible:outline-2',
        isPending
          ? 'h-full w-8 rounded-lg focus-visible:outline-warning'
          : 'size-11 rounded-full focus-visible:outline-brand-900',
        isSelected && (isPending ? 'bg-warning/10' : 'bg-brand-900/10'),
      )}
    >
      {isPending ? (
        <span className="h-full border-l-[1.5px] border-dashed border-warning" />
      ) : (
        <span
          className={cn(
            'size-2.5 rounded-full bg-brand-900 ring-2 ring-white transition-[scale] duration-150',
            isSelected && 'scale-150',
          )}
        />
      )}
    </button>
  );
}
