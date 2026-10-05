const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const plural = (count: number, singular: string, many: string) =>
  `Há ${count} ${count === 1 ? singular : many}`;

export function formatRelativeTime(isoDate: string, now: Date = new Date()): string {
  const date = new Date(isoDate);
  const elapsed = now.getTime() - date.getTime();
  if (elapsed < MINUTE) return 'Agora';
  if (elapsed < HOUR) return plural(Math.floor(elapsed / MINUTE), 'minuto', 'minutos');
  if (elapsed < DAY) return plural(Math.floor(elapsed / HOUR), 'hora', 'horas');
  if (elapsed < 2 * DAY) return 'Ontem';
  if (elapsed < 7 * DAY) return plural(Math.floor(elapsed / DAY), 'dia', 'dias');
  return date.toLocaleDateString('pt-BR');
}
