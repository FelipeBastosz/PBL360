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
  sessionId?: string;
  currentGrade?: number | string | null;
  currentFeedback?: string | null;
  updatedAt?: string | null;
};

type FormErrors = {
  nota?: string;
  texto?: string;
  justificativa?: string;
};

function resolveExistingGrade(
  current: number | string | null | undefined,
  feedback: StudentProblemFeedbackResponse | null,
): number | null {
  if (feedback?.nota !== undefined && feedback?.nota !== null) return Number(feedback.nota);
  if (current !== undefined && current !== null && current !== '') {
    const num = Number(String(current).replace(',', '.'));
    return Number.isNaN(num) ? null : num;
  }
  return null;
}

function checkGradeChanged(newNota: string, existingGrade: number | null): boolean {
  if (existingGrade === null) return false;
  const parsed = Number(newNota.replace(',', '.'));
  if (Number.isNaN(parsed)) return false;
  return Math.abs(parsed - existingGrade) >= 0.005;
}

function validateGrade(nota: string): string | undefined {
  if (!nota.trim()) return 'A nota é obrigatória.';
  const parsed = Number(nota.replace(',', '.'));
  if (Number.isNaN(parsed) || parsed < 0 || parsed > 10) {
    return Number.isNaN(parsed)
      ? 'A nota deve ser um número válido.'
      : 'A nota deve estar entre 0 e 10.';
  }
  return undefined;
}

function validateJustification(isGradeChanged: boolean, justificativa: string): string | undefined {
  if (!isGradeChanged) return undefined;
  const trimmed = justificativa.trim();
  if (!trimmed) return 'A justificativa do ajuste é obrigatória.';
  if (trimmed.length < 10) return 'A justificativa deve ter no mínimo 10 caracteres.';
  if (trimmed.length > 500) return 'A justificativa deve ter no máximo 500 caracteres.';
  return undefined;
}

function validateStudentFeedback(
  nota: string,
  texto: string,
  changed: boolean,
  just: string,
): FormErrors {
  const errors: FormErrors = {};
  const gradeErr = validateGrade(nota);
  const justErr = validateJustification(changed, just);
  if (gradeErr) errors.nota = gradeErr;
  if (!texto.trim()) errors.texto = 'O comentário de feedback é obrigatório.';
  if (justErr) errors.justificativa = justErr;
  return errors;
}

function getInitialNota(
  current: number | string | null | undefined,
  feedback: StudentProblemFeedbackResponse | null,
): string {
  if (feedback?.nota !== null && feedback?.nota !== undefined) return String(feedback.nota);
  return current !== undefined && current !== null ? String(current) : '';
}

function getInitialTexto(
  current: string | null | undefined,
  feedback: StudentProblemFeedbackResponse | null,
): string {
  return feedback?.texto || current || '';
}

type SubmitParams = {
  roomId: string;
  problemId: string;
  studentId: string;
  sessionId?: string;
  nota: string;
  texto: string;
  justificativa?: string;
};

async function submitStudent(params: SubmitParams) {
  return feedbackService.saveStudentFeedback(params.roomId, params.problemId, params.studentId, {
    escopo: 'ALUNO',
    destinatario_id: params.studentId,
    sessao_id: params.sessionId,
    nota: Number(params.nota.replace(',', '.')),
    texto: params.texto.trim(),
    justificativa: params.justificativa?.trim() || undefined,
  });
}

function getStudentError(err: unknown) {
  return (err as { message?: string })?.message || 'Não foi possível salvar o feedback do aluno.';
}

type SubmitCallbacks = {
  notify: (t: { tone: 'success' | 'error'; message: string }) => void;
  onSaved: (feedback: StudentProblemFeedbackResponse) => void;
  onClose: () => void;
  setApiError: (err: string | null) => void;
  setIsSubmitting: (sub: boolean) => void;
};

async function executeSubmitStudent(params: SubmitParams, callbacks: SubmitCallbacks) {
  callbacks.setIsSubmitting(true);
  callbacks.setApiError(null);
  try {
    const saved = await submitStudent(params);
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

function useFeedbackFormState(
  currentGrade?: number | string | null,
  currentFeedback?: string | null,
  existingFeedback?: StudentProblemFeedbackResponse | null,
) {
  const [nota, setNota] = useState(() => getInitialNota(currentGrade, existingFeedback));
  const [texto, setTexto] = useState(() => getInitialTexto(currentFeedback, existingFeedback));
  const [justificativa, setJustificativa] = useState(() => existingFeedback?.justificativa ?? '');
  const [errors, setErrors] = useState<FormErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const clearErr = (k: keyof FormErrors) => setErrors((p) => (p[k] ? { ...p, [k]: undefined } : p));

  return {
    nota,
    setNota,
    texto,
    setTexto,
    justificativa,
    setJustificativa,
    errors,
    setErrors,
    apiError,
    setApiError,
    isSubmitting,
    setIsSubmitting,
    handleNotaChange: (v: string) => {
      setNota(v);
      clearErr('nota');
    },
    handleTextoChange: (v: string) => {
      setTexto(v);
      clearErr('texto');
    },
    handleJustificativaChange: (v: string) => {
      setJustificativa(v);
      clearErr('justificativa');
    },
  };
}

function resolveEffectiveDate(
  updatedAt?: string | null,
  fb?: StudentProblemFeedbackResponse | null,
) {
  return updatedAt || fb?.updatedAt || fb?.editadoEm || fb?.criadoEm;
}

function createSubmitHandler(
  params: UseStudentFeedbackFormParams,
  form: ReturnType<typeof useFeedbackFormState>,
  isGradeChanged: boolean,
  notify: (t: { tone: 'success' | 'error'; message: string }) => void,
) {
  return (e: FormEvent) => {
    e.preventDefault();
    const valErrors = validateStudentFeedback(
      form.nota,
      form.texto,
      isGradeChanged,
      form.justificativa,
    );
    if (Object.keys(valErrors).length > 0) return form.setErrors(valErrors);
    executeSubmitStudent(
      {
        roomId: params.roomId,
        problemId: params.problemId,
        studentId: params.student.alunoId,
        sessionId: params.sessionId,
        nota: form.nota,
        texto: form.texto,
        justificativa: isGradeChanged ? form.justificativa : undefined,
      },
      {
        notify,
        onSaved: params.onSaved,
        onClose: params.onClose,
        setApiError: form.setApiError,
        setIsSubmitting: form.setIsSubmitting,
      },
    );
  };
}

export function useStudentFeedbackForm(params: UseStudentFeedbackFormParams) {
  const { notify } = useToast();
  const existingGrade = resolveExistingGrade(params.currentGrade, params.existingFeedback);
  const form = useFeedbackFormState(
    params.currentGrade,
    params.currentFeedback,
    params.existingFeedback,
  );
  const isGradeChanged = checkGradeChanged(form.nota, existingGrade);
  const handleSubmit = createSubmitHandler(params, form, isGradeChanged, notify);
  const lastEditedText = formatLastEdited(
    resolveEffectiveDate(params.updatedAt, params.existingFeedback),
  );

  return {
    ...form,
    existingGrade,
    isEditingExistingGrade: existingGrade !== null,
    isGradeChanged,
    handleSubmit,
    lastEditedText,
  };
}
