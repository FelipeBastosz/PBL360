import { type ReactNode, useEffect, useRef } from 'react';
import { useEscapeKey } from '@/hooks/useEscapeKey';

type ChatDialogProps = {
  titleId: string;
  onClose: () => void;
  children: ReactNode;
};

// A bottom sheet on phones and a drawer from the right on large screens.
export function ChatDialog({ titleId, onClose, children }: ChatDialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  useEscapeKey(true, onClose);

  useEffect(() => panelRef.current?.focus(), []);

  return (
    <div className="fixed inset-0 z-50">
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
        className="absolute inset-x-0 top-10 bottom-0 flex overflow-hidden rounded-t-3xl bg-white shadow-2xl animate-sheet-up focus:outline-none lg:inset-y-0 lg:right-0 lg:left-auto lg:w-[min(56rem,100%)] lg:rounded-none lg:animate-drawer-in"
      >
        {children}
      </div>
    </div>
  );
}
