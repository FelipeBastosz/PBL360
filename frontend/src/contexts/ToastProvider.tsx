import { type ReactNode, useCallback, useMemo, useState } from 'react';
import { Toast } from '@/components/ui/Toast';
import { ToastContext, type ToastInput } from './toastContext';

type ToastItem = ToastInput & { id: number };

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const notify = useCallback((toast: ToastInput) => {
    nextId += 1;
    setToasts((current) => [...current, { ...toast, id: nextId }]);
  }, []);

  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 top-4 z-50 flex flex-col items-center gap-2 px-4 lg:top-auto lg:right-6 lg:bottom-6 lg:left-auto lg:items-end"
      >
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            id={toast.id}
            tone={toast.tone}
            message={toast.message}
            onDismiss={dismiss}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
