const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

export function formatDayShortMonth(isoDate: string): string {
  const [, month, day] = isoDate.split('-');
  const name = MONTHS[Number(month) - 1];
  return name && day ? `${Number(day)} ${name}` : isoDate;
}

export function formatDayMonth(isoDate: string): string {
  const [, month, day] = isoDate.split('-');
  return month && day ? `${day}/${month}` : isoDate;
}
