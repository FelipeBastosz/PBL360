export const BRAND_900 = '#000077';
export const BRAND_700 = '#1A1A8C';
export const LILAC_300 = '#9494CE';
export const INK = '#10214C';
export const MUTED = '#5F5E5A';
export const MISSING = '#9A9A95';
export const CARD = '#F7F8FB';
export const STRIPE = '#EEEEFB';
export const WHITE = '#FFFFFF';

export interface ReportTone {
  foreground: string;
}

const SUCCESS: ReportTone = { foreground: '#067647' };
const WARNING: ReportTone = { foreground: '#B54708' };
const DANGER: ReportTone = { foreground: '#B42318' };
const NEUTRAL: ReportTone = { foreground: '#475467' };

const STATUS_TONES: ReadonlyMap<string, ReportTone> = new Map([
  ['Presente', SUCCESS],
  ['Nota enviada', SUCCESS],
  ['Completa', SUCCESS],
  ['Atrasado', WARNING],
  ['Parcial', WARNING],
  ['Rascunho', WARNING],
  ['Justificado', NEUTRAL],
  ['Falta justificada', NEUTRAL],
  ['Não registrada', NEUTRAL],
  ['Pendente', NEUTRAL],
  ['Ausente', DANGER],
]);

const MAX_GRADE = 10;
const PASSING_GRADE = 7;
const WARNING_GRADE = 5;

export const statusTone = (value: string): ReportTone | undefined => STATUS_TONES.get(value);

export const gradeTone = (value: number): ReportTone | undefined => {
  if (value < 0 || value > MAX_GRADE) return undefined;
  if (value >= PASSING_GRADE) return SUCCESS;
  return value >= WARNING_GRADE ? WARNING : DANGER;
};

export const toArgb = (hex: string): string => `FF${hex.slice(1).toUpperCase()}`;
