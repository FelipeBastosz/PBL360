import { useState, type FormEvent } from 'react';
import type { GeneralFeedbackResponse } from '@/types/feedback';
import { feedbackService } from '@/services/feedback.service';
import { useToast } from '@/hooks/useToast';
import { formatLastEdited } from '@/utils/gradeFormatters';

export type UseGeneralFeedbackFormParams = {
  existingFeedback: GeneralFeedbackResponse | null;
  roomId: string;
  problemId: string;
  onSaved: (feedback: GeneralFeedbackResponse) => void;
  onClose: () => void;
  updatedAt?: string | null;
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

async function executeSubmitGeneral(
  params: { roomId: string; problemId: string; texto: string },
  callbacks: {
    notify: (t: { tone: 'success' | 'error'; message: string }) => void;
    onSaved: (feedback: GeneralFeedbackResponse) => void;
    onClose: () => void;
    setApiError: (err: string | null) => void;
    setIsSubmitting: (sub: boolean) => void;
  },
) {
  callbacks.setIsSubmitting(true);
  callbacks.setApiError(null);
  try {
    const saved = await submitGeneral(params.roomId, params.problemId, params.texto);
    callbacks.notify({ tone: 'success', message: 'Feedback geral salvo com sucesso!' });
    callbacks.onSaved(saved);
    callbacks.onClose();
  } catch (err: unknown) {
    const msg = getErrorMessage(err);
    callbacks.setApiError(msg);
    callbacks.notify({ tone: 'error', message: msg });
  } finally {
    callbacks.setIsSubmitting(false);
  }
}

export function useGeneralFeedbackForm({
  existingFeedback,
  roomId,
  problemId,
  onSaved,
  onClose,
  updatedAt,
}: UseGeneralFeedbackFormParams) {
  const { notify } = useToast();
  const [texto, setTexto] = useState(existingFeedback?.texto ?? '');
  const [error, setError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!texto.trim()) {
      setError('O comentário de feedback geral é obrigatório.');
      return;
    }
    executeSubmitGeneral(
      { roomId, problemId, texto },
      { notify, onSaved, onClose, setApiError, setIsSubmitting },
    );
  };

  const effectiveDate =
    updatedAt ||
    (existingFeedback as { updatedAt?: string | null })?.updatedAt ||
    existingFeedback?.editadoEm ||
    existingFeedback?.criadoEm;

  return {
    texto,
    setTexto,
    error,
    setError,
    apiError,
    isSubmitting,
    handleSubmit,
    lastEditedText: formatLastEdited(effectiveDate),
  };
}
