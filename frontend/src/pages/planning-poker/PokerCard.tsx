import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';
import type { PokerStudent } from '@/types/planningPoker';
import { firstName } from '@/utils/pokerFormat';
import { StudentAvatar } from '../roll-call/StudentAvatar';

export function PokerCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-black/5 bg-white shadow-[0_1px_2px_rgb(16_33_76/0.06)]">
      <div className="h-1 bg-brand-900" />
      <div className={cn('flex flex-col gap-3 p-4', className)}>{children}</div>
    </div>
  );
}

export function StudentPill({ student }: { student: PokerStudent }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-white py-[3px] pr-2.5 pl-[3px] text-[13px] font-medium text-ink">
      <StudentAvatar student={student} className="size-[22px] text-[9px]" />
      {firstName(student.nome)}
    </span>
  );
}

export function TextLink({
  children,
  onClick,
  tone = 'brand',
}: {
  children: ReactNode;
  onClick: () => void;
  tone?: 'brand' | 'muted' | 'danger';
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'self-center p-2 text-sm font-medium underline underline-offset-4',
        tone === 'brand' && 'text-brand-900',
        tone === 'muted' && 'text-muted',
        tone === 'danger' && 'text-danger',
      )}
    >
      {children}
    </button>
  );
}
