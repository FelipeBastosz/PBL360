import type { ReactNode } from 'react';
import type { PerformanceTimelineSession } from '@/types/studentPerformance';
import { cn } from '@/utils/cn';
import { useSessionSelection } from '../hooks/useSessionSelection';
import { PerformanceChart } from './PerformanceChart';
import { SessionFocusCard } from './SessionFocusCard';

// Past this many sessions the dots stop being readable; the counter and the chart remain.
const MAX_DOTS = 12;

type SessionDotsProps = {
  sessions: PerformanceTimelineSession[];
  selectedIndex: number;
  onSelect: (index: number) => void;
};

function SessionDots({ sessions, selectedIndex, onSelect }: SessionDotsProps) {
  if (sessions.length < 2 || sessions.length > MAX_DOTS) return null;
  return (
    <div className="flex justify-center gap-1.5">
      {sessions.map((session, index) => (
        <button
          key={session.sessaoId}
          type="button"
          aria-label={`Ir para ${session.rotulo} de ${session.problemaTitulo}`}
          aria-current={index === selectedIndex ? 'true' : undefined}
          onClick={() => onSelect(index)}
          className="flex h-6 items-center px-0.5 focus-visible:outline-2 focus-visible:outline-brand-accent"
        >
          <span
            className={cn(
              'block h-2 rounded-full transition-[width,background-color] duration-200',
              index === selectedIndex ? 'w-5 bg-brand-accent' : 'w-2',
              index !== selectedIndex && (session.nota === null ? 'bg-warning-line' : 'bg-border'),
            )}
          />
        </button>
      ))}
    </div>
  );
}

type PerformanceOverviewProps<T extends PerformanceTimelineSession> = {
  sessions: T[];
  pendingNote: (session: T) => string;
  renderDetails: (session: T) => ReactNode;
};

export function PerformanceOverview<T extends PerformanceTimelineSession>({
  sessions,
  pendingNote,
  renderDetails,
}: PerformanceOverviewProps<T>) {
  const { index, select, previous, next } = useSessionSelection(sessions);
  const session = sessions[index];

  // minmax(0, …) keeps a long chart scrolling inside its card instead of widening the page.
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-start">
      <PerformanceChart sessions={sessions} selectedIndex={index} onSelect={select} />
      <div className="flex flex-col gap-3">
        <SessionFocusCard
          session={session}
          position={index + 1}
          total={sessions.length}
          onPrevious={previous}
          onNext={next}
          pendingNote={pendingNote(session)}
        >
          {renderDetails(session)}
        </SessionFocusCard>
        <SessionDots sessions={sessions} selectedIndex={index} onSelect={select} />
        <p className="text-center text-xs text-muted">
          Deslize o card ou toque em uma sessão no gráfico.
        </p>
      </div>
    </div>
  );
}
