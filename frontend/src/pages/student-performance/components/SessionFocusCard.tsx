import { type PointerEvent, type ReactNode, useRef } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import type { PerformanceTimelineSession } from '@/types/studentPerformance';
import { formatDate } from '@/utils/date';
import { GradeBar, GradeDisplay } from './SessionDetails';

const SWIPE_THRESHOLD_PX = 40;

type SessionFocusCardProps = {
  session: PerformanceTimelineSession;
  pendingNote: string;
  // What else the viewer may know about the session (tutors and students see different data).
  children: ReactNode;
  position: number;
  total: number;
  onPrevious: () => void;
  onNext: () => void;
};

const NAV_BUTTON_CLASS =
  'flex size-11 items-center justify-center rounded-xl bg-subtle text-brand-accent transition-[background-color,scale] duration-200 hover:bg-brand-soft active:scale-95 disabled:cursor-default disabled:opacity-35 focus-visible:outline-2 focus-visible:outline-brand-accent';

function useSwipe(onPrevious: () => void, onNext: () => void) {
  const startX = useRef<number | null>(null);
  return {
    onPointerDown: (event: PointerEvent<HTMLElement>) => {
      startX.current = event.clientX;
    },
    onPointerUp: (event: PointerEvent<HTMLElement>) => {
      if (startX.current === null) return;
      const distance = event.clientX - startX.current;
      startX.current = null;
      if (distance <= -SWIPE_THRESHOLD_PX) onNext();
      else if (distance >= SWIPE_THRESHOLD_PX) onPrevious();
    },
  };
}

export function SessionFocusCard(props: SessionFocusCardProps) {
  const { session, position, total, onPrevious, onNext, pendingNote, children } = props;
  const swipe = useSwipe(onPrevious, onNext);

  return (
    <section
      aria-label="Sessão selecionada"
      {...swipe}
      className="touch-pan-y overflow-hidden rounded-2xl border border-border-subtle bg-elevated shadow-[0_14px_30px_-20px_var(--color-brand-shadow)] select-none"
    >
      <div className="flex items-center gap-1 border-b border-border-subtle p-1.5">
        <button
          type="button"
          aria-label="Sessão anterior"
          disabled={position === 1}
          onClick={onPrevious}
          className={NAV_BUTTON_CLASS}
        >
          <ChevronLeftIcon className="size-5" aria-hidden />
        </button>
        <p aria-live="polite" className="flex-1 text-center text-sm font-semibold text-muted">
          Sessão {position} de {total}
        </p>
        <button
          type="button"
          aria-label="Próxima sessão"
          disabled={position === total}
          onClick={onNext}
          className={NAV_BUTTON_CLASS}
        >
          <ChevronRightIcon className="size-5" aria-hidden />
        </button>
      </div>
      <div className="flex flex-col gap-4 p-4">
        <div className="flex items-start gap-3">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <p className="truncate text-xs font-bold text-brand-accent">{session.problemaTitulo}</p>
            <h2 className="text-2xl leading-tight font-bold text-ink">{session.rotulo}</h2>
            <p className="text-sm text-muted">{formatDate(session.data)}</p>
          </div>
          <GradeDisplay session={session} pendingNote={pendingNote} />
        </div>
        <GradeBar session={session} />
        {children}
      </div>
    </section>
  );
}
