import { useEffect, useId, useRef, type ReactNode } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useEscapeKey } from '@/hooks/useEscapeKey';
import { cn } from '@/utils/cn';

type SheetProps = {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  description?: ReactNode;
  leading?: ReactNode;
  placement?: 'bottom' | 'center';
};

type SheetHeaderProps = Pick<SheetProps, 'title' | 'description' | 'leading' | 'onClose'> & {
  titleId: string;
};

function SheetHeader({ title, description, leading, onClose, titleId }: SheetHeaderProps) {
  return (
    <div className="flex items-center gap-3 px-6 pt-4 pb-2 sm:pt-6">
      {leading}
      <div className="min-w-0 flex-1">
        <h2 id={titleId} className="truncate text-xl font-semibold text-ink">
          {title}
        </h2>
        {description && <p className="truncate text-sm text-muted">{description}</p>}
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Fechar"
        className="-mr-2 rounded-full p-2 text-muted transition-[background-color,scale] duration-200 hover:bg-black/5 active:scale-90 focus-visible:outline-2 focus-visible:outline-brand-900"
      >
        <XMarkIcon className="size-6" aria-hidden />
      </button>
    </div>
  );
}

export function Sheet({ isOpen, onClose, children, placement = 'bottom', ...header }: SheetProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const isCentered = placement === 'center';
  useEscapeKey(isOpen, onClose);

  useEffect(() => {
    if (isOpen) panelRef.current?.focus();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex justify-center sm:items-center sm:p-4',
        isCentered ? 'items-center p-4' : 'items-end',
      )}
    >
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
        className={cn(
          'relative flex max-h-[88dvh] w-full flex-col bg-white shadow-2xl focus:outline-none sm:max-w-lg sm:rounded-3xl sm:animate-pop-in',
          isCentered ? 'max-w-md rounded-3xl animate-pop-in' : 'rounded-t-3xl animate-sheet-up',
        )}
      >
        {!isCentered && (
          <div className="mx-auto mt-3 h-1.5 w-10 shrink-0 rounded-full bg-black/10 sm:hidden" />
        )}
        <SheetHeader {...header} onClose={onClose} titleId={titleId} />
        <div className="overflow-y-auto px-6 pt-2 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          {children}
        </div>
      </div>
    </div>
  );
}
