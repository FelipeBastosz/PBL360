import type { FieldErrors } from '@/hooks/useForm';
import { parseDisplayDate } from './date';

export type SessionFormValues = {
  titulo: string;
  descricao: string;
  /** DD/MM/AAAA, as typed in the date field. */
  data: string;
};

export function validateSessionForm(values: SessionFormValues): FieldErrors<SessionFormValues> {
  const errors: FieldErrors<SessionFormValues> = {};

  if (!values.titulo.trim()) {
    errors.titulo = 'O título da sessão é obrigatório.';
  } else if (values.titulo.length > 120) {
    errors.titulo = 'O título deve ter no máximo 120 caracteres.';
  }

  if (values.descricao && values.descricao.length > 1000) {
    errors.descricao = 'A descrição deve ter no máximo 1000 caracteres.';
  }

  if (!values.data) {
    errors.data = 'A data da sessão é obrigatória.';
  } else if (!parseDisplayDate(values.data)) {
    errors.data = 'Informe uma data válida no formato DD/MM/AAAA.';
  }

  return errors;
}
