import { createContext } from 'react';

export type ToastTone = 'success' | 'error' | 'info';

export type ToastInput = {
  tone: ToastTone;
  message: string;
};

export type ToastContextValue = {
  notify: (toast: ToastInput) => void;
};

export const ToastContext = createContext<ToastContextValue | null>(null);
