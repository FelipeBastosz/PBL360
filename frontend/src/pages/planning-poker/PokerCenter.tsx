import type { PokerStudent } from '@/types/planningPoker';
import { formatPokerGrade } from '@/utils/pokerFormat';
import { StudentAvatar } from '../roll-call/StudentAvatar';
import { CardsIcon } from './CardsIcon';

export function WaitingCenter({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <CardsIcon className="size-9 text-brand-900" />
      <span className="text-sm leading-tight font-semibold text-balance text-brand-900">
        {title}
      </span>
      {subtitle && <span className="text-xs text-muted">{subtitle}</span>}
    </div>
  );
}

export function EvaluatedCenter({ student }: { student: PokerStudent }) {
  return (
    <div className="flex w-full flex-col overflow-hidden rounded-[14px] border border-black/5 bg-white shadow-[0_14px_28px_-14px_rgb(0_0_119/0.45)] animate-pop-in">
      <div className="h-1 bg-brand-900" />
      <div className="flex flex-col items-center gap-1.5 px-2 py-3">
        <StudentAvatar
          student={student}
          className="size-[52px] text-base max-[359px]:size-11 lg:size-[60px] lg:text-xl"
        />
        <span className="text-sm leading-tight font-semibold text-ink">{student.nome}</span>
        <span className="text-[11px] text-muted">Em avaliação</span>
      </div>
    </div>
  );
}

export function AverageCenter({ average, name }: { average: number | null; name: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 animate-pop-in">
      <span className="text-xs font-semibold text-muted">Média</span>
      <span className="text-[42px] leading-none font-bold tracking-tight text-brand-900 max-[359px]:text-[34px] lg:text-[60px]">
        {formatPokerGrade(average)}
      </span>
      <span className="mt-1.5 text-xs font-semibold text-ink">{name}</span>
    </div>
  );
}
