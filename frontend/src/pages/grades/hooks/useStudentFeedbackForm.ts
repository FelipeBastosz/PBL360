import { useState, type FormEvent } from 'react';
import type { StudentGradeRow } from '@/types/grades';
import type { StudentProblemFeedbackResponse } from '@/types/feedback';
import { feedbackService } from '@/services/feedback.service';
import { useToast } from '@/hooks/useToast';
import { formatLastEdited } from '@/utils/gradeFormatters';

type UseStudentFeedbackFormParams = {
  student: StudentGradeRow;
  existingFeedback: StudentProblemFeedbackResponse | null;
  roomId: string;
  problemId: string;
  onSaved: (feedback: StudentProblemFeedbackResponse) => void;
  onClose: () => void;
};

type FormErrors = { nota?: string; texto?: string };

function validateStudentFeedback(nota: string, texto: string): FormErrors {
  const errors: FormErrors = {};
  if (!nota.trim()) {
    errors.nota = 'A nota é obrigatória.';
  } else {
    const parsed = Number(nota.replace(',', '.'));
    if (Number.isNaN(parsed) || parsed < 0 || parsed > 10) {
      errors.nota = Number.isNaN(parsed)
        ? 'A nota deve ser um número válido.'
        : 'A nota deve estar entre 0 e 10.';
    }
  }

  if (!texto.trim()) {
    errors.texto = 'O comentário de feedback é obrigatório.';
  }
  return errors;
}

function getInitialNota(feedback: StudentProblemFeedbackResponse | null): string {
  return feedback?.nota !== null && feedback?.nota !== undefined ? String(feedback.nota) : '';
}

async function submitStudent(
  roomId: string,
  problemId: string,
  studentId: string,
  nota: string,
  texto: string,
) {
  return feedbackService.saveStudentFeedback(roomId, problemId, studentId, {
    escopo: 'ALUNO',
    destinatario_id: studentId,
    nota: Number(nota.replace(',', '.')),
    texto: texto.trim(),
  });
}

function getStudentError(err: unknown) {
  return (err as { message?: string })?.message || 'Não foi possível salvar o feedback do aluno.';
}

export function useStudentFeedbackForm({
  student,
  existingFeedback,
  roomId,
  problemId,
  onSaved,
  onClose,
}: UseStudentFeedbackFormParams) {
  const { notify } = useToast();
  const [nota, setNota] = useState(getInitialNota(existingFeedback));
  const [texto, setTexto] = useState(existingFeedback?.texto ?? '');
  const [errors, setErrors] = useState<FormErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const valErrors = validateStudentFeedback(nota, texto);
    if (Object.keys(valErrors).length > 0) {
      setErrors(valErrors);
      return;
    }
    setIsSubmitting(true);
    setApiError(null);
    try {
      const saved = await submitStudent(roomId, problemId, student.alunoId, nota, texto);
      notify({ tone: 'success', message: 'Feedback salvo com sucesso!' });
      onSaved(saved);
      onClose();
    } catch (err: unknown) {
      const msg = getStudentError(err);
      setApiError(msg);
      notify({ tone: 'error', message: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    nota,
    setNota,
    texto,
    setTexto,
    errors,
    setErrors,
    apiError,
    isSubmitting,
    handleSubmit,
    lastEditedText: formatLastEdited(existingFeedback?.editadoEm || existingFeedback?.criadoEm),
  };
}
