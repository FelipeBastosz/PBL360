import {
  ReportColumnType,
  type ReportCellValue,
  type ReportColumn,
} from '../domain/report-document';

export const MISSING_VALUE_LABEL = '—';
export const MISSING_TEXT_LABEL = 'Não informado.';
export const EMPTY_TABLE_MESSAGE = 'Nenhum registro.';
export const EMPTY_TEXT_SECTION_MESSAGE = 'Nenhum texto registrado.';
export const EMPTY_DOCUMENT_MESSAGE = 'Nenhum conteúdo para exibir.';
export const TEXT_SECTION_HEADERS = ['Item', 'Texto'];

const DEFAULT_DECIMALS = 2;
const MAX_DECIMALS = 6;

export const columnDecimals = ({ decimals }: ReportColumn): number => {
  if (decimals === undefined || !Number.isFinite(decimals)) return DEFAULT_DECIMALS;
  return Math.min(Math.max(Math.trunc(decimals), 0), MAX_DECIMALS);
};

export const normalizeCell = (
  value: ReportCellValue | undefined,
  type: ReportColumnType,
): ReportCellValue => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return null;
    return type === ReportColumnType.TEXT ? String(value) : value;
  }
  return value;
};

export const formatCellText = (value: ReportCellValue, decimals = DEFAULT_DECIMALS): string => {
  if (value === null) return MISSING_VALUE_LABEL;
  if (typeof value === 'string') return value;
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};
