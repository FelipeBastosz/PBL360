import { XMarkIcon } from '@heroicons/react/24/outline';
import { useEffect } from 'react';
import { Alert, type AlertTone } from './Alert';

const TOAST_DURATION_MS = 5000;

type ToastProps = {
  id: number;
  tone: AlertTone;
  message: string;
  onDismiss: (id: number) => void;
};

export function Toast({ id, tone, message, onDismiss }: ToastProps) {
  useEffect(() => {
    const timer = window.setTimeout(() => onDismiss(id), TOAST_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [id, onDismiss]);

  return (
    <Alert tone={tone} className="pointer-events-auto w-full max-w-sm shadow-lg">
      <div className="flex items-start justify-between gap-3">
        <span>{message}</span>
        <button
          type="button"
          onClick={() => onDismiss(id)}
          aria-label="Fechar aviso"
          className="rounded p-0.5 opacity-70 hover:opacity-100 focus-visible:outline-2"
        >
          <XMarkIcon className="size-4" aria-hidden />
        </button>
      </div>
    </Alert>
  );
}
