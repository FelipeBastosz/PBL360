import { CheckIcon } from '@heroicons/react/24/outline';
import { cn } from '@/utils/cn';
import type { SeatPosition } from '@/utils/seatLayout';
import { StudentAvatar } from '../roll-call/StudentAvatar';
import type { SeatTone, SeatVariant, SeatView } from './pokerSeats';

const DISC =
  'relative flex size-[50px] items-center justify-center rounded-full text-base font-semibold text-white select-none max-[359px]:size-[42px] max-[359px]:text-[13px] lg:size-14';

const DISC_VARIANTS: Partial<Record<SeatVariant, string>> = {
  student: 'border-[3px] border-white shadow-[0_6px_16px_-8px_var(--color-brand-shadow)]',
  done: 'border-[3px] border-white opacity-55 shadow-[0_6px_16px_-8px_var(--color-brand-shadow)]',
  choosable: 'cursor-pointer border-[3px] border-white shadow-[0_0_0_4px_rgb(158_158_255/0.6)]',
  evaluated: 'border-2 border-dashed border-brand-accent shadow-[0_0_0_3px_var(--color-surface)]',
  voted: 'border-[3px] border-brand-border shadow-[0_0_0_5px_rgb(158_158_255/0.35)]',
  waitingVote: 'border-[3px] border-white opacity-40',
  anonVoted:
    'border-[3px] border-brand-border bg-brand-primary shadow-[0_0_0_5px_rgb(158_158_255/0.35)]',
  anonWaiting: 'border-2 border-dashed border-brand-accent/35 bg-brand-soft',
};

const CARD =
  'flex h-12 w-9 items-center justify-center rounded-lg border-[1.5px] border-t-4 text-sm font-bold shadow-[0_6px_16px_-10px_var(--color-brand-shadow)] max-[359px]:h-[42px] max-[359px]:w-[30px] max-[359px]:text-xs lg:h-14 lg:w-[42px] lg:text-base';

const BADGE_TONES: Record<SeatTone, string> = {
  lilac: 'border-brand-border bg-brand-soft text-brand-accent',
  ok: 'border-emerald-400 bg-emerald-50 text-emerald-800 dark:border-emerald-500/80 dark:bg-emerald-950 dark:text-emerald-300',
  you: 'border-brand-accent bg-brand-primary text-brand-on-primary',
};

function SeatDisc({ seat }: { seat: SeatView }) {
  const content = seat.student ? (
    <StudentAvatar student={seat.student} className="size-full" />
  ) : null;
  const hasCheck = seat.variant === 'voted' || seat.variant === 'anonVoted';
  const className = cn(DISC, DISC_VARIANTS[seat.variant]);
  const body = (
    <>
      {content}
      {hasCheck && (
        <span className="absolute -right-[5px] -bottom-[5px] flex size-5 items-center justify-center rounded-full bg-success ring-2 ring-surface">
          <CheckIcon className="size-3 text-white" strokeWidth={3} aria-hidden />
        </span>
      )}
    </>
  );
  if (seat.onTap) {
    return (
      <button type="button" aria-label={seat.label} onClick={seat.onTap} className={className}>
        {body}
      </button>
    );
  }
  return (
    <div role="img" aria-label={seat.label} className={className}>
      {body}
    </div>
  );
}

function SeatCard({ seat }: { seat: SeatView }) {
  const isEmpty = seat.variant === 'emptyCard';
  return (
    <div
      role="img"
      aria-label={seat.label}
      className={cn(
        CARD,
        isEmpty
          ? 'border-dashed border-brand-accent/35 bg-elevated/60 text-placeholder'
          : 'border-brand-accent bg-elevated text-ink',
      )}
    >
      {seat.cardText}
    </div>
  );
}

export function PokerSeat({ seat, position }: { seat: SeatView; position: SeatPosition }) {
  const isCard = seat.variant === 'card' || seat.variant === 'emptyCard';
  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${position.left}%`, top: `${position.top}%` }}
    >
      <div className="relative flex justify-center">
        {isCard ? <SeatCard seat={seat} /> : <SeatDisc seat={seat} />}
        {seat.badge && (
          <span
            className={cn(
              'absolute top-[calc(100%-8px)] left-1/2 -translate-x-1/2 rounded-full border px-1.5 text-[10px] leading-4 font-semibold whitespace-nowrap',
              BADGE_TONES[seat.badge.tone],
            )}
          >
            {seat.badge.text}
          </span>
        )}
        {seat.name && (
          <span className="absolute top-[calc(100%+2px)] left-1/2 -translate-x-1/2 text-[10px] font-semibold whitespace-nowrap text-ink">
            {seat.name}
          </span>
        )}
      </div>
    </div>
  );
}
