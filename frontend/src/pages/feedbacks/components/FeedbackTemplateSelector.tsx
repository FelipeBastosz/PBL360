import { useState, useId, useRef, useEffect } from 'react';
import { DocumentTextIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Spinner } from '@/components/ui/Spinner';
import { useEscapeKey } from '@/hooks/useEscapeKey';
import { useFeedbackTemplates } from '@/hooks/useFeedbackTemplates';
import type { FeedbackTemplateResponse } from '@/types/feedback';

export type FeedbackTemplateSelectorProps = {
  onSelect: (templateText: string) => void;
  disabled?: boolean;
  templates?: FeedbackTemplateResponse[];
  isLoading?: boolean;
  error?: string | null;
};

type TemplateModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (template: FeedbackTemplateResponse) => void;
  templates: FeedbackTemplateResponse[];
  isLoading: boolean;
  error: string | null;
};

function TemplateItem({
  template,
  onSelect,
}: {
  template: FeedbackTemplateResponse;
  onSelect: (t: FeedbackTemplateResponse) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(template)}
      className="group flex flex-col items-start gap-1 rounded-2xl border border-black/10 p-4 text-left transition hover:border-brand-900/40 hover:bg-brand-50/50 focus-visible:border-brand-900 focus-visible:bg-brand-50/50 focus-visible:outline-none"
    >
      <span className="text-sm font-bold text-ink group-hover:text-brand-900">
        {template.titulo}
      </span>
      <p className="line-clamp-2 text-xs text-muted">{template.texto}</p>
    </button>
  );
}

function TemplateListBody({
  isLoading,
  error,
  templates,
  onSelect,
}: Omit<TemplateModalProps, 'isOpen' | 'onClose'>) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-10">
        <Spinner className="size-6 text-brand-900" />
        <span className="text-xs text-muted">Carregando modelos...</span>
      </div>
    );
  }

  if (error || templates.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted">
        {error || 'Nenhum modelo de feedback disponível.'}
      </p>
    );
  }

  return (
    <div className="flex max-h-[50vh] flex-col gap-2.5 overflow-y-auto px-6 py-2">
      {templates.map((tmpl) => (
        <TemplateItem key={tmpl.id} template={tmpl} onSelect={onSelect} />
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
        className="rounded-full p-1.5 text-muted hover:bg-black/5 active:scale-90 focus-visible:outline-2 focus-visible:outline-brand-900"
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
        className="rounded-xl border border-black/15 bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:bg-black/5 active:scale-95 focus-visible:outline-2 focus-visible:outline-brand-900"
      >
        Cancelar
      </button>
    </div>
  );
}

function TemplateModal({
  isOpen,
  onClose,
  onSelect,
  templates,
  isLoading,
  error,
}: TemplateModalProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  useEscapeKey(isOpen, onClose);

  useEffect(() => {
    if (isOpen) panelRef.current?.focus();
  }, [isOpen]);

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
        className="relative flex max-h-[85vh] w-full max-w-lg flex-col rounded-3xl bg-white shadow-2xl focus:outline-none animate-pop-in"
      >
        <TemplateModalHeader titleId={titleId} onClose={onClose} />
        <TemplateListBody
          isLoading={isLoading}
          error={error}
          templates={templates}
          onSelect={onSelect}
        />
        <TemplateModalFooter onClose={onClose} />
      </div>
    </div>
  );
}

export function FeedbackTemplateSelector({
  onSelect,
  disabled = false,
  templates: propsTemplates,
  isLoading: propsLoading,
  error: propsError,
}: FeedbackTemplateSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const hookResult = useFeedbackTemplates();

  const templates = propsTemplates ?? hookResult.templates;
  const isLoading = propsLoading ?? hookResult.isLoading;
  const error = propsError !== undefined ? propsError : hookResult.error;

  const handleSelect = (tmpl: FeedbackTemplateResponse) => {
    onSelect(tmpl.texto);
    setIsOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        disabled={disabled}
        aria-label="Usar modelo de feedback"
        className="inline-flex items-center gap-1.5 rounded-lg border border-brand-900/20 bg-brand-50/70 px-2.5 py-1 text-xs font-semibold text-brand-900 transition hover:bg-brand-100/70 active:scale-95 focus-visible:outline-2 focus-visible:outline-brand-900 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <DocumentTextIcon className="size-4 shrink-0 text-brand-900" aria-hidden />
        Usar modelo
      </button>

      <TemplateModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSelect={handleSelect}
        templates={templates}
        isLoading={isLoading}
        error={error}
      />
    </>
  );
}
