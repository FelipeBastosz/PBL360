import { useEffect, useId, useRef, type ReactNode } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

type SheetProps = {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
};

function useCloseOnEscape(isOpen: boolean, onClose: () => void) {
  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);
}

export function Sheet({ isOpen, title, onClose, children }: SheetProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  useCloseOnEscape(isOpen, onClose);

  useEffect(() => {
    if (isOpen) panelRef.current?.focus();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        tabIndex={-1}
        aria-hidden
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-black/50 backdrop-blur-xs animate-fade-in"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="relative flex max-h-[88dvh] w-full flex-col rounded-t-3xl bg-white shadow-2xl animate-sheet-up focus:outline-none sm:max-w-lg sm:rounded-3xl sm:animate-pop-in"
      >
        <div className="mx-auto mt-3 h-1.5 w-10 shrink-0 rounded-full bg-black/10 sm:hidden" />
        <div className="flex items-center justify-between gap-4 px-6 pt-4 pb-2 sm:pt-6">
          <h2 id={titleId} className="text-xl font-semibold text-ink">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="-mr-2 rounded-full p-2 text-muted transition-[background-color,scale] duration-200 hover:bg-black/5 active:scale-90 focus-visible:outline-2 focus-visible:outline-brand-900"
          >
            <XMarkIcon className="size-6" aria-hidden />
          </button>
        </div>
        <div className="overflow-y-auto px-6 pt-2 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          {children}
        </div>
      </div>
    </div>
  );
}
