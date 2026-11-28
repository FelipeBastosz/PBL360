import { XMarkIcon } from '@heroicons/react/24/outline';
import { Spinner } from '@/components/ui/Spinner';
import { useEscapeKey } from '@/hooks/useEscapeKey';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { AppearanceSection } from './AppearanceSection';

export type AppearanceModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

function AppearanceModalHeader({ isSaving, onClose }: { isSaving: boolean; onClose: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border-subtle pb-3">
      <div className="flex items-center gap-2">
        <h2 id="appearance-modal-title" className="text-left text-lg font-semibold text-ink">
          Personalização
        </h2>
        <span
          aria-live="polite"
          className="inline-flex items-center gap-1 text-[11px] font-medium text-muted"
        >
          {isSaving ? (
            <>
              <Spinner className="size-3 text-brand-accent" />
              Salvando...
            </>
          ) : null}
        </span>
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Fechar personalização"
        className="-mr-2 rounded-full p-2 text-muted transition-[background-color,scale] duration-200 hover:bg-subtle active:scale-90 focus-visible:outline-2 focus-visible:outline-brand-accent"
      >
        <XMarkIcon className="size-6" aria-hidden />
      </button>
    </div>
  );
}

export function AppearanceModal({ isOpen, onClose }: AppearanceModalProps) {
  const { isSaving } = useUserPreferences();
  useEscapeKey(isOpen, onClose);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="appearance-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <button
        type="button"
        tabIndex={-1}
        aria-hidden
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-black/50 backdrop-blur-xs animate-fade-in"
      />
      <div className="relative flex max-h-[90vh] w-full max-w-sm flex-col overflow-y-auto rounded-3xl border border-border-subtle bg-elevated p-5 shadow-2xl animate-pop-in">
        <AppearanceModalHeader isSaving={isSaving} onClose={onClose} />
        <div className="mt-4">
          <AppearanceSection showHeader={false} />
        </div>
      </div>
    </div>
  );
}
