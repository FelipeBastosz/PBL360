import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

export type AlertTone = 'success' | 'error' | 'info';

type AlertProps = {
  tone: AlertTone;
  children: ReactNode;
  className?: string;
};

const TONES: Record<AlertTone, { className: string; Icon: typeof CheckCircleIcon }> = {
  success: { className: 'border-success/30 text-success bg-success-soft', Icon: CheckCircleIcon },
  error: { className: 'border-danger/30 text-danger bg-danger-soft', Icon: ExclamationCircleIcon },
  info: {
    className: 'border-brand-300/40 text-brand-900 bg-brand-50',
    Icon: InformationCircleIcon,
  },
};

export function Alert({ tone, children, className }: AlertProps) {
  const { className: toneClassName, Icon } = TONES[tone];

  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn(
        'flex items-start gap-2 rounded-[10px] border p-3 text-sm',
        toneClassName,
        className,
      )}
    >
      <Icon className="mt-px size-5 shrink-0" aria-hidden />
      <div className="flex-1">{children}</div>
    </div>
  );
}
