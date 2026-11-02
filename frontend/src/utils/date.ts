// Calendar dates (a session day, a problem start) travel as DD-MM-AAAA in the API contract and
// are typed as DD/MM/AAAA in the interface. They are handled as plain day/month/year parts and
// never go through `new Date(string)`, which would read them as UTC midnight and shift the day
// in negative offsets such as America/Sao_Paulo. Instants (deadlines, timestamps) travel as ISO
// 8601 and are shown in the viewer's local time.

export type DateParts = { day: number; month: number; year: number };

const API_DATE = /^(\d{2})-(\d{2})-(\d{4})$/;
const LEGACY_ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const DISPLAY_DATE = /^(\d{2})\/(\d{2})\/(\d{4})$/;
const TIME = /^([01]\d|2[0-3]):([0-5]\d)$/;

const SHORT_MONTHS = [
  'jan',
  'fev',
  'mar',
  'abr',
  'mai',
  'jun',
  'jul',
  'ago',
  'set',
  'out',
  'nov',
  'dez',
];

export const DATE_PLACEHOLDER = 'DD/MM/AAAA';
export const TIME_PLACEHOLDER = 'HH:MM';

const pad = (value: number) => String(value).padStart(2, '0');

export function isValidDateParts({ day, month, year }: DateParts): boolean {
  const date = new Date(2000, 0, 1);
  // setFullYear keeps years below 100 literal, unlike the Date constructor
  date.setFullYear(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

function toParts(match: RegExpExecArray | null, [d, m, y]: [number, number, number]) {
  if (!match) return null;
  const parts = { day: Number(match[d]), month: Number(match[m]), year: Number(match[y]) };
  return isValidDateParts(parts) ? parts : null;
}

/** Reads a calendar date from the API (DD-MM-AAAA). AAAA-MM-DD is still accepted for legacy data. */
export function parseApiDate(value: string | null | undefined): DateParts | null {
  if (!value) return null;
  return (
    toParts(API_DATE.exec(value), [1, 2, 3]) ?? toParts(LEGACY_ISO_DATE.exec(value), [3, 2, 1])
  );
}

/** Reads a date typed by the user (DD/MM/AAAA). */
export function parseDisplayDate(value: string | null | undefined): DateParts | null {
  if (!value) return null;
  return toParts(DISPLAY_DATE.exec(value), [1, 2, 3]);
}

function partsOfInstant(date: Date): DateParts {
  return { day: date.getDate(), month: date.getMonth() + 1, year: date.getFullYear() };
}

/** Accepts either a calendar date or an ISO instant (read in local time). */
export function toDateParts(value: string | null | undefined): DateParts | null {
  if (!value) return null;
  const calendar = parseApiDate(value);
  if (calendar) return calendar;
  const instant = new Date(value);
  return Number.isNaN(instant.getTime()) ? null : partsOfInstant(instant);
}

export function formatDateParts({ day, month, year }: DateParts): string {
  return `${pad(day)}/${pad(month)}/${year}`;
}

export function todayParts(now: Date = new Date()): DateParts {
  return partsOfInstant(now);
}

/** DD/MM/AAAA. Unreadable values are kept as they are so nothing disappears from the screen. */
export function formatDate(value: string | null | undefined): string {
  if (!value) return '';
  const parts = toDateParts(value);
  return parts ? formatDateParts(parts) : value;
}

/** DD/MM — compact label used in headings next to the session title. */
export function formatDayMonth(value: string | null | undefined): string {
  if (!value) return '';
  const parts = toDateParts(value);
  return parts ? `${pad(parts.day)}/${pad(parts.month)}` : value;
}

/** "12 ago" — compact label used on cards and headers. */
export function formatDayShortMonth(value: string | null | undefined): string {
  if (!value) return '';
  const parts = toDateParts(value);
  return parts ? `${parts.day} ${SHORT_MONTHS[parts.month - 1]}` : value;
}

function formatTime(date: Date): string {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** DD/MM/AAAA às HH:MM, in local time. */
export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${formatDateParts(partsOfInstant(date))} às ${formatTime(date)}`;
}

export function formatDeadline(value: string | null | undefined): string {
  if (!value) return 'Sem prazo limite';
  const formatted = formatDateTime(value);
  return formatted === value ? value : `Até ${formatted}`;
}

/** DD/MM/AAAA (typed) → DD-MM-AAAA (API). Returns null for an invalid date. */
export function toApiDate(display: string): string | null {
  const parts = parseDisplayDate(display);
  return parts ? `${pad(parts.day)}-${pad(parts.month)}-${parts.year}` : null;
}

/** DD-MM-AAAA (API) → DD/MM/AAAA, ready to be placed in a date field. */
export function fromApiDate(value: string | null | undefined): string {
  const parts = parseApiDate(value);
  return parts ? formatDateParts(parts) : '';
}

export function isValidTime(value: string): boolean {
  return TIME.test(value);
}

/** Local date (DD/MM/AAAA) + time (HH:MM) → ISO 8601 instant, as the API expects for deadlines. */
export function toApiDateTime(display: string, time: string): string | null {
  const parts = parseDisplayDate(display);
  const match = TIME.exec(time);
  if (!parts || !match) return null;
  const date = new Date(2000, 0, 1, Number(match[1]), Number(match[2]));
  date.setFullYear(parts.year, parts.month - 1, parts.day);
  return date.toISOString();
}

function maskDigits(raw: string, maxDigits: number, separators: Record<number, string>): string {
  const digits = raw.replace(/\D/g, '').slice(0, maxDigits);
  return [...digits].map((digit, index) => (separators[index] ?? '') + digit).join('');
}

/** Formats what the user types as DD/MM/AAAA. */
export function maskDate(raw: string): string {
  return maskDigits(raw, 8, { 2: '/', 4: '/' });
}

/** Formats what the user types as HH:MM. */
export function maskTime(raw: string): string {
  return maskDigits(raw, 4, { 2: ':' });
}
