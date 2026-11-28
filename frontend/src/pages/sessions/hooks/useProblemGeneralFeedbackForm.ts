import { useState, type FormEvent } from 'react';
import { feedbackService } from '@/services/feedback.service';
import { useToast } from '@/hooks/useToast';
import type { GeneralFeedbackResponse } from '@/types/feedback';
import { formatLastEdited } from '@/utils/gradeFormatters';

export const MAX_GENERAL_FEEDBACK_LENGTH = 2000;

export type UseProblemGeneralFeedbackFormParams = {
  existingFeedback: GeneralFeedbackResponse | null;
  roomId: string;
  problemId: string;
  onSaved: (feedback: GeneralFeedbackResponse | null) => void;
  onClose: () => void;
};

export function validateGeneralFeedbackText(text: string): string | null {
  const trimmed = text.trim();
  if (trimmed.length > MAX_GENERAL_FEEDBACK_LENGTH) {
    return `O comentário de feedback geral deve ter no máximo ${MAX_GENERAL_FEEDBACK_LENGTH} caracteres.`;
  }
  return null;
}

function resolveSaveError(err: unknown): string {
  return (
    (err as { message?: string })?.message || 'Não foi possível salvar o feedback geral da turma.'
  );
}

function resolveSaveSuccessMessage(
  saved: GeneralFeedbackResponse | null,
  existingFeedback: GeneralFeedbackResponse | null,
): string {
  return saved === null && existingFeedback !== null
    ? 'Feedback geral removido com sucesso!'
    : 'Feedback geral salvo com sucesso!';
}

function resolveEffectiveDate(feedback: GeneralFeedbackResponse | null): string | null {
  return feedback?.updatedAt ?? feedback?.editadoEm ?? feedback?.criadoEm ?? null;
}

export function useProblemGeneralFeedbackForm({
  existingFeedback,
  roomId,
  problemId,
  onSaved,
  onClose,
}: UseProblemGeneralFeedbackFormParams) {
  const { notify } = useToast();
  const [texto, setTexto] = useState(existingFeedback?.texto ?? '');
  const [error, setError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const validationError = validateGeneralFeedbackText(texto);
    if (validationError) return setError(validationError);

    setIsSubmitting(true);
    setApiError(null);
    setError(null);
    try {
      const saved = await feedbackService.saveGeneralFeedback(roomId, problemId, {
        texto: texto.trim(),
      });
      notify({ tone: 'success', message: resolveSaveSuccessMessage(saved, existingFeedback) });
      onSaved(saved);
      onClose();
    } catch (err: unknown) {
      const message = resolveSaveError(err);
      setApiError(message);
      notify({ tone: 'error', message });
    } finally {
      setIsSubmitting(false);
    }
  }

  return {
    texto,
    setTexto,
    error,
    setError,
    apiError,
    isSubmitting,
    handleSubmit,
    lastEditedText: formatLastEdited(resolveEffectiveDate(existingFeedback)),
  };
}
