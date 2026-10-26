import type { ReactNode } from 'react';
import { ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useEscapeKey } from '@/hooks/useEscapeKey';
import { cn } from '@/utils/cn';

type PokerModalProps = {
  isOpen: boolean;
  label: string;
  onClose: () => void;
  danger?: boolean;
  children: ReactNode;
};

export function PokerModal({ isOpen, label, onClose, danger = false, children }: PokerModalProps) {
  useEscapeKey(isOpen, onClose);
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={label}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
    >
      <div
        className={cn(
          'relative max-h-full w-full max-w-sm overflow-y-auto rounded-[24px] bg-white p-6 shadow-2xl animate-pop-in',
          danger && 'border-2 border-danger',
        )}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="absolute top-4 right-4 rounded-full p-1 text-ink/60 hover:bg-black/5 hover:text-ink"
        >
          <XMarkIcon className="size-6" />
        </button>
        {children}
      </div>
    </div>
  );
}

export function WarningIcon({ tone }: { tone: 'warning' | 'danger' }) {
  return (
    <div
      className={cn(
        'flex size-12 items-center justify-center rounded-full',
        tone === 'danger' ? 'bg-danger/10 text-danger' : 'bg-warning-soft text-warning',
      )}
    >
      <ExclamationTriangleIcon className="size-7" aria-hidden />
    </div>
  );
}
