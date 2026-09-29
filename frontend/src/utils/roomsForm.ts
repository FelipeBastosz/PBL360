import type { FieldErrors } from '@/hooks/useForm';

export type CreateRoomFormValues = {
  codigo: string;
  disciplina: string;
  turma: string;
  semestre: string;
};

export function validateCreateRoomForm(
  values: CreateRoomFormValues,
): FieldErrors<CreateRoomFormValues> {
  const errors: FieldErrors<CreateRoomFormValues> = {};

  if (!values.codigo.trim()) {
    errors.codigo = 'O código é obrigatório.';
  } else if (!/^[A-Za-z]{3}[0-9]{3}$/.test(values.codigo.trim())) {
    errors.codigo = 'Use o formato ABC123 (ex.: TEC409).';
  }

  if (!values.disciplina.trim()) {
    errors.disciplina = 'A disciplina é obrigatória.';
  }

  if (!values.turma.trim()) {
    errors.turma = 'A turma é obrigatória.';
  }

  if (!values.semestre.trim()) {
    errors.semestre = 'O semestre é obrigatório.';
  } else if (!/^\d{4}\.[1-2]$/.test(values.semestre.trim())) {
    errors.semestre = 'Use o formato AAAA.S (ex.: 2026.2).';
  }

  return errors;
}
