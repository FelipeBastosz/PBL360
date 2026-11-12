import { XMarkIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { useEscapeKey } from '@/hooks/useEscapeKey';

export type LegalDocumentModalProps = {
  isOpen: boolean;
  title: string;
  content: string;
  onClose: () => void;
  zIndex?: string;
};

export function LegalDocumentModal({
  isOpen,
  title,
  content,
  onClose,
  zIndex = 'z-50',
}: LegalDocumentModalProps) {
  useEscapeKey(isOpen, onClose);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="legal-document-modal-title"
      className={`fixed inset-0 ${zIndex} flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-fade-in`}
    >
      <div className="relative flex max-h-[90vh] w-full max-w-md flex-col rounded-3xl bg-white p-6 shadow-2xl animate-pop-in">
        <div className="flex items-center justify-between gap-3 border-b border-black/5 pb-4">
          <h2 id="legal-document-modal-title" className="text-xl font-semibold text-ink text-left">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={`Fechar ${title}`}
            className="-mr-2 rounded-full p-2 text-muted transition-[background-color,scale] duration-200 hover:bg-black/5 active:scale-90 focus-visible:outline-2 focus-visible:outline-brand-900"
          >
            <XMarkIcon className="size-6" />
          </button>
        </div>

        <div className="mt-4 overflow-y-auto py-2">
          <p className="text-left text-sm leading-relaxed text-muted whitespace-pre-line">
            {content}
          </p>
        </div>

        <div className="mt-6 border-t border-black/5 pt-4">
          <Button
            type="button"
            onClick={onClose}
            className="w-full shadow-none hover:shadow-none active:shadow-none"
          >
            Fechar
          </Button>
        </div>
      </div>
    </div>
  );
}
