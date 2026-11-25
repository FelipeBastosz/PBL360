import type { StudentPerformanceSession } from '@/types/studentPerformance';
import { cn } from '@/utils/cn';
import { useSessionSelection } from '../hooks/useSessionSelection';
import { PerformanceChart } from './PerformanceChart';
import { SessionFocusCard } from './SessionFocusCard';

// Past this many sessions the dots stop being readable; the counter and the chart remain.
const MAX_DOTS = 12;

type SessionDotsProps = {
  sessions: StudentPerformanceSession[];
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
          className="flex h-6 items-center px-0.5 focus-visible:outline-2 focus-visible:outline-brand-900"
        >
          <span
            className={cn(
              'block h-2 rounded-full transition-[width,background-color] duration-200',
              index === selectedIndex ? 'w-5 bg-brand-900' : 'w-2',
              index !== selectedIndex &&
                (session.nota === null ? 'bg-warning-line' : 'bg-black/15'),
            )}
          />
        </button>
      ))}
    </div>
  );
}

export function PerformanceOverview({ sessions }: { sessions: StudentPerformanceSession[] }) {
  const { index, select, previous, next } = useSessionSelection(sessions);

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-start">
      <PerformanceChart sessions={sessions} selectedIndex={index} onSelect={select} />
      <div className="flex flex-col gap-3">
        <SessionFocusCard
          session={sessions[index]}
          position={index + 1}
          total={sessions.length}
          onPrevious={previous}
          onNext={next}
        />
        <SessionDots sessions={sessions} selectedIndex={index} onSelect={select} />
        <p className="text-center text-xs text-muted">
          Deslize o card ou toque em uma sessão no gráfico.
        </p>
      </div>
    </div>
  );
}
