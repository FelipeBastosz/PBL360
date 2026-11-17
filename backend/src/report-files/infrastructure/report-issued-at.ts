export interface ReportIssuedAt {
  date: string;
  time: string;
}

const TIME_ZONE = 'America/Sao_Paulo';

const DATE_FORMAT = new Intl.DateTimeFormat('pt-BR', {
  timeZone: TIME_ZONE,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const TIME_FORMAT = new Intl.DateTimeFormat('pt-BR', {
  timeZone: TIME_ZONE,
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

export const formatIssuedAt = (issuedAt: Date): ReportIssuedAt => ({
  date: DATE_FORMAT.format(issuedAt),
  time: TIME_FORMAT.format(issuedAt),
});
