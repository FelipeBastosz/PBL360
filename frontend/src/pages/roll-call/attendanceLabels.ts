import type { AttendanceStatus } from '@/types/session';

export const STATUS_LABEL: Record<AttendanceStatus, string> = {
  PRESENTE: 'Presente',
  ATRASADO: 'Atrasado',
  JUSTIFICADO: 'Justificado',
  AUSENTE: 'Ausente',
};

export const STATUS_TEXT_CLASS: Record<AttendanceStatus, string> = {
  PRESENTE: 'text-success',
  ATRASADO: 'text-warning',
  JUSTIFICADO: 'text-brand-900',
  AUSENTE: 'text-danger',
};
