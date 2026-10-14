import { useState, type FormEvent } from 'react';
import type { StudentGradeRow } from '@/types/grades';
import type { StudentProblemFeedbackResponse } from '@/types/feedback';
import { feedbackService } from '@/services/feedback.service';
import { useToast } from '@/hooks/useToast';
import { formatLastEdited } from '@/utils/gradeFormatters';

export type UseStudentFeedbackFormParams = {
  student: StudentGradeRow;
  existingFeedback: StudentProblemFeedbackResponse | null;
  roomId: string;
  problemId: string;
  onSaved: (feedback: StudentProblemFeedbackResponse) => void;
  onClose: () => void;
  currentGrade?: number | string | null;
  currentFeedback?: string | null;
  updatedAt?: string | null;
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

function getInitialNota(
  currentGrade: number | string | null | undefined,
  feedback: StudentProblemFeedbackResponse | null,
): string {
  if (currentGrade !== undefined && currentGrade !== null && currentGrade !== '') {
    return String(currentGrade);
  }
  return feedback?.nota !== null && feedback?.nota !== undefined ? String(feedback.nota) : '';
}

function getInitialTexto(
  currentFeedback: string | null | undefined,
  feedback: StudentProblemFeedbackResponse | null,
): string {
  if (currentFeedback !== undefined && currentFeedback !== null && currentFeedback !== '') {
    return currentFeedback;
  }
  return feedback?.texto ?? '';
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

async function executeSubmitStudent(
  params: { roomId: string; problemId: string; studentId: string; nota: string; texto: string },
  callbacks: {
    notify: (t: { tone: 'success' | 'error'; message: string }) => void;
    onSaved: (feedback: StudentProblemFeedbackResponse) => void;
    onClose: () => void;
    setApiError: (err: string | null) => void;
    setIsSubmitting: (sub: boolean) => void;
  },
) {
  callbacks.setIsSubmitting(true);
  callbacks.setApiError(null);
  try {
    const saved = await submitStudent(
      params.roomId,
      params.problemId,
      params.studentId,
      params.nota,
      params.texto,
    );
    callbacks.notify({ tone: 'success', message: 'Feedback salvo com sucesso!' });
    callbacks.onSaved(saved);
    callbacks.onClose();
  } catch (err: unknown) {
    const msg = getStudentError(err);
    callbacks.setApiError(msg);
    callbacks.notify({ tone: 'error', message: msg });
  } finally {
    callbacks.setIsSubmitting(false);
  }
}

export function useStudentFeedbackForm({
  student,
  existingFeedback,
  roomId,
  problemId,
  onSaved,
  onClose,
  currentGrade,
  currentFeedback,
  updatedAt,
}: UseStudentFeedbackFormParams) {
  const { notify } = useToast();
  const [nota, setNota] = useState(() => getInitialNota(currentGrade, existingFeedback));
  const [texto, setTexto] = useState(() => getInitialTexto(currentFeedback, existingFeedback));
  const [errors, setErrors] = useState<FormErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const valErrors = validateStudentFeedback(nota, texto);
    if (Object.keys(valErrors).length > 0) {
      setErrors(valErrors);
      return;
    }
    executeSubmitStudent(
      { roomId, problemId, studentId: student.alunoId, nota, texto },
      { notify, onSaved, onClose, setApiError, setIsSubmitting },
    );
  };

  const effectiveDate =
    updatedAt ||
    (existingFeedback as { updatedAt?: string | null })?.updatedAt ||
    existingFeedback?.editadoEm ||
    existingFeedback?.criadoEm;

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
    lastEditedText: formatLastEdited(effectiveDate),
  };
}
