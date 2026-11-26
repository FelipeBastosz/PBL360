import { useState } from 'react';
import { DocumentTextIcon } from '@heroicons/react/24/outline';
import { useFeedbackTemplates } from '@/hooks/useFeedbackTemplates';
import { TemplateModal } from './TemplateModal';
import type { FeedbackTemplateResponse } from '@/types/feedback';

export type FeedbackTemplateSelectorProps = {
  onSelect: (templateText: string) => void;
  disabled?: boolean;
  currentFeedback?: string;
  templates?: FeedbackTemplateResponse[];
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
};

export function FeedbackTemplateSelector({
  onSelect,
  disabled = false,
  currentFeedback,
  templates: propsTemplates,
  isLoading: propsLoading,
  error: propsError,
  onRetry: propsRetry,
}: FeedbackTemplateSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const hookResult = useFeedbackTemplates();

  const templates = propsTemplates ?? hookResult.templates;
  const isLoading = propsLoading ?? hookResult.isLoading;
  const error = propsError !== undefined ? propsError : hookResult.error;
  const handleRetry = propsRetry ?? hookResult.fetchTemplates;

  const handleOpen = () => {
    setIsOpen(true);
    if (!propsTemplates) {
      void (hookResult.fetchTemplates?.() ?? hookResult.reload?.());
    }
  };

  const handleSelect = (tmpl: FeedbackTemplateResponse) => {
    onSelect(tmpl.texto);
    setIsOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        disabled={disabled}
        aria-label="Usar modelo de feedback"
        className="inline-flex items-center gap-1.5 rounded-lg border border-brand-accent/20 bg-brand-soft/70 px-2.5 py-1 text-xs font-semibold text-brand-accent transition hover:bg-brand-soft/70 active:scale-95 focus-visible:outline-2 focus-visible:outline-brand-accent disabled:cursor-not-allowed disabled:opacity-50"
      >
        <DocumentTextIcon className="size-4 shrink-0 text-brand-accent" aria-hidden />
        Usar modelo
      </button>

      <TemplateModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSelect={handleSelect}
        templates={templates}
        isLoading={isLoading}
        error={error}
        onRetry={handleRetry}
        currentFeedback={currentFeedback}
      />
    </>
  );
}
