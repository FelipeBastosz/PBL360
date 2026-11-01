import type { FieldErrors } from '@/hooks/useForm';

export type SessionFormValues = {
  titulo: string;
  descricao: string;
  data: string;
};

export function toInputDate(dateStr?: string | null): string {
  if (!dateStr) return '';
  const clean = dateStr.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean;
  const [day, month, year] = clean.split('-');
  if (day && month && year && year.length === 4) {
    return `${year}-${month}-${day}`;
  }
  return clean;
}

export function toApiDate(dateStr?: string | null): string {
  if (!dateStr) return '';
  const clean = dateStr.trim();
  if (/^\d{2}-\d{2}-\d{4}$/.test(clean)) return clean;
  const [year, month, day] = clean.split('-');
  if (year && month && day && year.length === 4) {
    return `${day}-${month}-${year}`;
  }
  return clean;
}

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
  }

  return errors;
}

export function formatSessionDisplayDate(dateStr?: string | null): string {
  if (!dateStr) return '';
  const parts = dateStr.trim().split('-');
  if (parts.length !== 3) return dateStr;

  let year: number;
  let month: number;
  let day: number;

  if (parts[0].length === 4) {
    [year, month, day] = parts.map(Number);
  } else {
    [day, month, year] = parts.map(Number);
  }

  const date = new Date(year, month - 1, day);
  const dayStr = String(day).padStart(2, '0');
  const monthStr = date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
  return `${dayStr} ${monthStr}`;
}
