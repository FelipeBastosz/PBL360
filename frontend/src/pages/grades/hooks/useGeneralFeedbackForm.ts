import { useState, type FormEvent } from 'react';
import type { GeneralFeedbackResponse } from '@/types/feedback';
import { feedbackService } from '@/services/feedback.service';
import { useToast } from '@/hooks/useToast';
import { formatLastEdited } from '@/utils/gradeFormatters';

type UseGeneralFeedbackFormParams = {
  existingFeedback: GeneralFeedbackResponse | null;
  roomId: string;
  problemId: string;
  onSaved: (feedback: GeneralFeedbackResponse) => void;
  onClose: () => void;
};

async function submitGeneral(roomId: string, problemId: string, texto: string) {
  return feedbackService.saveGeneralFeedback(roomId, problemId, {
    escopo: 'PROBLEMA',
    destinatario_id: null,
    nota: null,
    texto: texto.trim(),
  });
}

function getErrorMessage(err: unknown) {
  return (
    (err as { message?: string })?.message || 'Não foi possível salvar o feedback geral da turma.'
  );
}

export function useGeneralFeedbackForm({
  existingFeedback,
  roomId,
  problemId,
  onSaved,
  onClose,
}: UseGeneralFeedbackFormParams) {
  const { notify } = useToast();
  const [texto, setTexto] = useState(existingFeedback?.texto ?? '');
  const [error, setError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!texto.trim()) {
      setError('O comentário de feedback geral é obrigatório.');
      return;
    }
    setIsSubmitting(true);
    setApiError(null);
    try {
      const saved = await submitGeneral(roomId, problemId, texto);
      notify({ tone: 'success', message: 'Feedback geral salvo com sucesso!' });
      onSaved(saved);
      onClose();
    } catch (err: unknown) {
      const msg = getErrorMessage(err);
      setApiError(msg);
      notify({ tone: 'error', message: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  const lastEditedText = formatLastEdited(
    existingFeedback?.editadoEm || existingFeedback?.criadoEm,
  );

  return {
    texto,
    setTexto,
    error,
    setError,
    apiError,
    isSubmitting,
    handleSubmit,
    lastEditedText,
  };
}
