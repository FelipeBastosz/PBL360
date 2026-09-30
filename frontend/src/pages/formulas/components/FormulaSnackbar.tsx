import { useEffect } from 'react';
import { cn } from '@/utils/cn';

export type SnackbarTone = 'success' | 'error';

type FormulaSnackbarProps = {
  message: string;
  tone?: SnackbarTone;
  onDismiss: () => void;
  durationMs?: number;
};

export function FormulaSnackbar({
  message,
  tone = 'success',
  onDismiss,
  durationMs = 4000,
}: FormulaSnackbarProps) {
  useEffect(() => {
    const timer = window.setTimeout(onDismiss, durationMs);
    return () => window.clearTimeout(timer);
  }, [onDismiss, durationMs]);

  return (
    <div className="fixed bottom-24 left-0 right-0 z-40 flex justify-center px-4 pointer-events-none">
      <div
        className={cn(
          'pointer-events-auto flex items-center justify-between gap-3 rounded-lg px-4 py-3 text-sm font-medium text-white shadow-lg animate-fade-up',
          tone === 'success' ? 'bg-success' : 'bg-danger',
        )}
      >
        <span>{message}</span>
      </div>
    </div>
  );
}
