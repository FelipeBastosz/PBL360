import { useId, useRef, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Spinner } from '@/components/ui/Spinner';
import { appendFeedbackTemplate, isFeedbackOverLimit } from '@/utils/feedbackTemplates';
import { cn } from '@/utils/cn';
import type { FeedbackTemplateResponse } from '@/types/feedback';

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [tabindex]:not([tabindex="-1"]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled])';

export type TemplateModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (template: FeedbackTemplateResponse) => void;
  templates: FeedbackTemplateResponse[];
  isLoading: boolean;
  error: string | null;
  onRetry?: () => void;
  currentFeedback?: string;
};

function useCaptureEscape(isOpen: boolean, onClose: () => void) {
  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopImmediatePropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, onClose]);
}

function handleTabTrap(e: KeyboardEvent, panel: HTMLElement) {
  const focusable = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
  if (focusable.length === 0) {
    e.preventDefault();
    return;
  }
  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  if (e.shiftKey && (document.activeElement === first || !panel.contains(document.activeElement))) {
    last.focus();
    e.preventDefault();
  } else if (
    !e.shiftKey &&
    (document.activeElement === last || !panel.contains(document.activeElement))
  ) {
    first.focus();
    e.preventDefault();
  }
}

function useFocusTrap(isOpen: boolean, panelRef: React.RefObject<HTMLDivElement | null>) {
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return undefined;
    previousActiveElementRef.current = document.activeElement as HTMLElement | null;

    const timer = setTimeout(() => {
      const panel = panelRef.current;
      if (!panel) return;
      const focusable = panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      if (focusable.length > 0) focusable[0]?.focus();
      else panel.focus();
    }, 0);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab' && panelRef.current) handleTabTrap(e, panelRef.current);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
      previousActiveElementRef.current?.focus();
    };
  }, [isOpen, panelRef]);
}

function TemplateItem({
  template,
  onSelect,
  currentFeedback,
}: {
  template: FeedbackTemplateResponse;
  onSelect: (t: FeedbackTemplateResponse) => void;
  currentFeedback?: string;
}) {
  const resultingText = appendFeedbackTemplate(currentFeedback, template.texto);
  const wouldExceedLimit = isFeedbackOverLimit(resultingText);

  return (
    <button
      type="button"
      onClick={() => onSelect(template)}
      disabled={wouldExceedLimit}
      title={template.texto}
      className={cn(
        'group flex flex-col items-start gap-1 rounded-2xl border p-4 text-left transition focus-visible:outline-none',
        wouldExceedLimit
          ? 'border-danger/30 bg-danger/5 opacity-70 cursor-not-allowed'
          : 'border-border hover:border-brand-accent/40 hover:bg-brand-soft/50 focus-visible:border-brand-accent focus-visible:bg-brand-soft/50',
      )}
    >
      <div className="flex w-full items-center justify-between gap-2">
        <span className="text-sm font-bold text-ink group-hover:text-brand-accent">
          {template.titulo}
        </span>
        {wouldExceedLimit && (
          <span className="rounded bg-danger/10 px-2 py-0.5 text-2xs font-bold text-danger">
            Excede limite (2000 carac.)
          </span>
        )}
      </div>
      <p title={template.texto} className="line-clamp-2 text-xs text-muted">
        {template.texto}
      </p>
    </button>
  );
}

function TemplateListBody({
  isLoading,
  error,
  templates,
  onSelect,
  onRetry,
  currentFeedback,
}: Omit<TemplateModalProps, 'isOpen' | 'onClose'>) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-10">
        <Spinner className="size-6 text-brand-accent" />
        <span className="text-xs text-muted">Carregando modelos...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 px-6 py-8 text-center">
        <p className="text-sm text-danger">{error}</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="rounded-xl border border-brand-accent/20 bg-brand-soft px-4 py-2 text-xs font-semibold text-brand-accent transition hover:bg-brand-soft active:scale-95 focus-visible:outline-2 focus-visible:outline-brand-accent"
          >
            Tentar novamente
          </button>
        )}
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted">Nenhum modelo de feedback disponível.</p>
    );
  }

  return (
    <div className="flex max-h-[50vh] flex-col gap-2.5 overflow-y-auto px-6 py-2">
      {templates.map((tmpl) => (
        <TemplateItem
          key={tmpl.id}
          template={tmpl}
          onSelect={onSelect}
          currentFeedback={currentFeedback}
        />
      ))}
    </div>
  );
}

function TemplateModalHeader({ titleId, onClose }: { titleId: string; onClose: () => void }) {
  return (
    <div className="flex items-start justify-between gap-3 px-6 pt-6 pb-2">
      <div>
        <h2 id={titleId} className="text-lg font-semibold text-ink">
          Modelos de feedback
        </h2>
        <p className="text-xs text-muted">Selecione um modelo para adicionar ao comentário.</p>
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Fechar"
        className="rounded-full p-1.5 text-muted hover:bg-subtle active:scale-90 focus-visible:outline-2 focus-visible:outline-brand-accent"
      >
        <XMarkIcon className="size-5" aria-hidden />
      </button>
    </div>
  );
}

function TemplateModalFooter({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex justify-end px-6 pt-3 pb-6">
      <button
        type="button"
        onClick={onClose}
        className="rounded-xl border border-border bg-elevated px-4 py-2 text-sm font-semibold text-ink transition hover:bg-subtle active:scale-95 focus-visible:outline-2 focus-visible:outline-brand-accent"
      >
        Cancelar
      </button>
    </div>
  );
}

export function TemplateModal({
  isOpen,
  onClose,
  onSelect,
  templates,
  isLoading,
  error,
  onRetry,
  currentFeedback,
}: TemplateModalProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useCaptureEscape(isOpen, onClose);
  useFocusTrap(isOpen, panelRef);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
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
        className="relative flex max-h-[85vh] w-full max-w-lg flex-col rounded-3xl bg-elevated shadow-2xl focus:outline-none animate-pop-in"
      >
        <TemplateModalHeader titleId={titleId} onClose={onClose} />
        <TemplateListBody
          isLoading={isLoading}
          error={error}
          templates={templates}
          onSelect={onSelect}
          onRetry={onRetry}
          currentFeedback={currentFeedback}
        />
        <TemplateModalFooter onClose={onClose} />
      </div>
    </div>
  );
}
