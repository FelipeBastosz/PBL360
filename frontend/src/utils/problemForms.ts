import type { FieldErrors } from '@/hooks/useForm';

export type ProblemFormValues = {
  titulo: string;
};

export function validateProblemForm(values: ProblemFormValues): FieldErrors<ProblemFormValues> {
  const errors: FieldErrors<ProblemFormValues> = {};

  if (!values.titulo.trim()) {
    errors.titulo = 'O título do problema é obrigatório.';
  } else if (values.titulo.length > 120) {
    errors.titulo = 'O título deve ter no máximo 120 caracteres.';
  }

  return errors;
}
