export function formatGrade(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '—';
  }
  return value.toFixed(1).replace('.', ',');
}

export function formatSessionCell(nota: number | null | undefined, situacao?: string): string {
  if (nota !== null && nota !== undefined && !Number.isNaN(nota)) {
    return nota.toFixed(1).replace('.', ',');
  }
  if (situacao === 'JUSTIFICADA') {
    return 'J';
  }
  if (situacao === 'AUSENTE') {
    return '0,0';
  }
  return '—';
}

export function formatLastEdited(isoDate?: string | null): string | null {
  if (!isoDate) return null;
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return null;
  const formatted = date.toLocaleDateString('pt-BR');
  const time = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return `${formatted} às ${time}`;
}
