import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

type BadgeTone = 'brand' | 'neutral';

type BadgeProps = {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
};

const TONES: Record<BadgeTone, string> = {
  brand: 'bg-brand-200 text-brand-900',
  neutral: 'bg-black/5 text-ink',
};

export function Badge({ children, tone = 'brand', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded-full px-4 py-1.5 text-sm font-semibold whitespace-nowrap',
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
