import { formatDateTime } from './date';
import { formatGrade } from './formatGrade';

export function formatSessionCell(nota: number | null | undefined, situacao?: string): string {
  if (nota !== null && nota !== undefined && !Number.isNaN(nota)) {
    return formatGrade(nota);
  }
  if (situacao === 'JUSTIFICADA') {
    return 'J';
  }
  if (situacao === 'AUSENTE') {
    return formatGrade(0);
  }
  return '—';
}

export function formatLastEdited(isoDate?: string | null): string | null {
  if (!isoDate) return null;
  if (isoDate.includes('às')) return isoDate;
  return formatDateTime(isoDate);
}

export function resolveSessionName(
  sessao?: {
    nome?: string;
    name?: string;
    titulo?: string;
    title?: string;
    descricao?: string;
    rotulo?: string;
  } | null,
): string {
  if (!sessao) return '';
  return (
    sessao.title ||
    sessao.nome ||
    sessao.name ||
    sessao.titulo ||
    sessao.descricao ||
    sessao.rotulo ||
    ''
  );
}
