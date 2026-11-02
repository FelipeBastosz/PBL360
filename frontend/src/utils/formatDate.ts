const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

export function formatDayShortMonth(isoDate: string): string {
  const [, month, day] = isoDate.split('-');
  const name = MONTHS[Number(month) - 1];
  return name && day ? `${Number(day)} ${name}` : isoDate;
}

export function formatFullDate(isoDateTime: string): string {
  const date = new Date(isoDateTime);
  return Number.isNaN(date.getTime()) ? isoDateTime : date.toLocaleDateString('pt-BR');
}

export function formatDayMonth(isoDate: string): string {
  const [, month, day] = isoDate.split('-');
  return month && day ? `${day}/${month}` : isoDate;
}

export function formatDeadline(isoDate: string | null | undefined): string {
  if (!isoDate) return 'Sem prazo limite';
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return isoDate;
  return `Até ${date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} às ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
}
