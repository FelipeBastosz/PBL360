import type { FieldErrors } from '@/hooks/useForm';

export type EditRoomFormValues = {
  turma: string;
  semestre: string;
};

export function validateEditRoomForm(values: EditRoomFormValues): FieldErrors<EditRoomFormValues> {
  const errors: FieldErrors<EditRoomFormValues> = {};

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
