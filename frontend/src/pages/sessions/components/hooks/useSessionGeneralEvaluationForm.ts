import { useState, type FormEvent } from 'react';
import type { SessionGeneralEvaluation } from '@/types/session';
import { sessionService } from '@/services/session.service';
import { useToast } from '@/hooks/useToast';
import { formatLastEdited } from '@/utils/gradeFormatters';

export type UseSessionGeneralEvaluationFormParams = {
  sessionId: string;
  existingEvaluation: SessionGeneralEvaluation | null;
  onSaved: (saved: SessionGeneralEvaluation) => void;
  onClose: () => void;
};

function validateEvaluationText(text: string): string | null {
  const trimmed = text.trim();
  if (!trimmed) return 'O comentário geral é obrigatório.';
  if (trimmed.length > 2000) return 'O comentário geral deve ter no máximo 2000 caracteres.';
  return null;
}

function resolveErrorMessage(err: unknown): string {
  return (
    (err as { message?: string })?.message || 'Não foi possível salvar a avaliação geral da sessão.'
  );
}

export function useSessionGeneralEvaluationForm({
  sessionId,
  existingEvaluation,
  onSaved,
  onClose,
}: UseSessionGeneralEvaluationFormParams) {
  const { notify } = useToast();
  const [texto, setTexto] = useState(existingEvaluation?.texto ?? '');
  const [error, setError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const effectiveDate = existingEvaluation?.editadoEm ?? existingEvaluation?.criadoEm ?? null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const validationError = validateEvaluationText(texto);
    if (validationError) return setError(validationError);

    setIsSubmitting(true);
    setApiError(null);
    try {
      const saved = await sessionService.saveGeneralEvaluation(sessionId, { texto: texto.trim() });
      notify({ tone: 'success', message: 'Avaliação geral salva com sucesso!' });
      onSaved(saved);
      onClose();
    } catch (err: unknown) {
      const msg = resolveErrorMessage(err);
      setApiError(msg);
      notify({ tone: 'error', message: msg });
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
    lastEditedText: formatLastEdited(effectiveDate),
    handleSubmit,
  };
}
