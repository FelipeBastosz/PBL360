import type { ReactNode } from 'react';
import { INTERACTIVE_CARD_CLASS } from '@/components/ui/cardStyles';
import { cn } from '@/utils/cn';
import { firstName } from '@/utils/members';
import { MemberAvatar } from './MemberAvatar';

type MemberCardProps = {
  name: string;
  photoUserId?: string;
  badge?: string;
  onSelect: () => void;
};

export function MemberCard({ name, photoUserId, badge, onSelect }: MemberCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-label={`Ver detalhes de ${name}`}
      className={cn(INTERACTIVE_CARD_CLASS, 'items-center gap-2 px-2 py-4 text-center')}
    >
      <MemberAvatar name={name} photoUserId={photoUserId} className="size-14 text-xl" />
      <span className="w-full truncate font-semibold text-brand-900">{firstName(name)}</span>
      {badge && (
        <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[11px] font-bold text-brand-900">
          {badge}
        </span>
      )}
    </button>
  );
}

type MemberSectionProps = {
  title: string;
  count: number;
  emptyMessage: string;
  children: ReactNode;
};

export function MemberSection({ title, count, emptyMessage, children }: MemberSectionProps) {
  return (
    <section aria-label={title} className="flex flex-col gap-3">
      <h2 className="text-xs font-bold uppercase tracking-widest text-muted">
        {title} · {count}
      </h2>
      {count === 0 ? (
        <p className="text-sm text-muted">{emptyMessage}</p>
      ) : (
        <div className="stagger-in grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {children}
        </div>
      )}
    </section>
  );
}
