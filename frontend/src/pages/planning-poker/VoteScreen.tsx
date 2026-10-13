import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import type { PokerStudent } from '@/types/planningPoker';
import { cn } from '@/utils/cn';
import { firstName, formatPokerGrade, formatPokerVote } from '@/utils/pokerFormat';
import { StudentAvatar } from '../roll-call/StudentAvatar';

const QUICK_CENTS = [0, 500, 600, 700, 750, 800, 850, 900, 950, 1000];
const FINE_STEP = 1;
const STEPPER =
  'size-11 rounded-xl border border-black/10 bg-white text-lg font-bold disabled:opacity-30';

type VoteScreenProps = {
  student: PokerStudent;
  initial: number | null;
  isBusy: boolean;
  onVote: (nota: number) => void;
};

function quickStyle(cents: number, value: number, nearest: number | undefined) {
  if (cents === value) {
    return 'border-brand-900 bg-brand-900 text-white shadow-[0_10px_20px_-10px_rgb(0_0_119/0.7)]';
  }
  if (cents === nearest) return 'border-brand-900 bg-brand-50 text-ink';
  return 'border-black/10 bg-white text-ink';
}

function QuickCards({ value, onPick }: { value: number; onPick: (cents: number) => void }) {
  const exact = QUICK_CENTS.includes(value);
  const nearest = exact ? undefined : QUICK_CENTS.filter((cents) => cents <= value).pop();
  return (
    <div className="grid grid-cols-5 gap-2">
      {QUICK_CENTS.map((cents) => (
        <button
          key={cents}
          type="button"
          aria-pressed={cents === value}
          onClick={() => onPick(cents)}
          className={cn(
            'aspect-[3/4] min-h-[52px] rounded-[10px] border-[1.5px] text-base font-bold',
            quickStyle(cents, value, nearest),
          )}
        >
          {formatPokerVote(cents / 100)}
        </button>
      ))}
    </div>
  );
}

function FineAdjust({ value, onChange }: { value: number; onChange: (cents: number) => void }) {
  return (
    <div className="flex items-center justify-between gap-2 border-t border-black/5 pt-3.5">
      <div className="flex min-w-0 flex-col">
        <span className="text-sm font-semibold text-brand-900">Ajuste fino</span>
        <span className="text-xs text-muted">Centésimos, de 0,01 em 0,01</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Diminuir nota"
          disabled={value <= 0}
          onClick={() => onChange(Math.max(0, value - FINE_STEP))}
          className={cn(STEPPER, 'text-ink')}
        >
          −
        </button>
        <span className="min-w-[52px] text-center text-base font-bold text-ink">
          {formatPokerGrade(value / 100)}
        </span>
        <button
          type="button"
          aria-label="Aumentar nota"
          disabled={value >= 1000}
          onClick={() => onChange(Math.min(1000, value + FINE_STEP))}
          className={cn(STEPPER, 'text-brand-900')}
        >
          +
        </button>
      </div>
    </div>
  );
}

export function VoteScreen({ student, initial, isBusy, onVote }: VoteScreenProps) {
  const [cents, setCents] = useState(Math.round((initial ?? 8.5) * 100));

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-3 pb-6">
      <div className="mx-auto flex max-w-md flex-col gap-4">
        <div className="flex flex-col overflow-hidden rounded-[20px] border border-black/5 bg-white shadow-[0_14px_28px_-18px_rgb(0_0_119/0.45)] animate-pop-in">
          <div className="h-1 bg-brand-900" />
          <div className="flex flex-col items-center gap-1.5 px-4 py-5 text-center">
            <StudentAvatar
              student={student}
              className="size-[88px] text-[28px] shadow-[0_0_0_4px_#fff,0_10px_24px_-10px_rgb(0_0_119/0.6)]"
            />
            <span className="mt-1.5 text-xl font-semibold text-ink">{student.nome}</span>
            <span className="text-[13px] text-balance text-muted">
              Que nota {firstName(student.nome)} merece pelo desempenho nesta sessão?
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-3.5 rounded-2xl border border-black/5 bg-white p-4 shadow-[0_1px_2px_rgb(16_33_76/0.06)]">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-sm font-semibold text-brand-900">Sua nota</span>
            <span className="text-[32px] leading-none font-bold text-brand-900">
              {formatPokerGrade(cents / 100)}
            </span>
          </div>
          <QuickCards value={cents} onPick={setCents} />
          <FineAdjust value={cents} onChange={setCents} />
        </div>
        <Button onClick={() => onVote(cents / 100)} isLoading={isBusy}>
          Votar
        </Button>
        <span className="text-center text-[13px] text-muted">
          Ninguém vê sua nota antes de o tutor revelar.
        </span>
      </div>
    </div>
  );
}
