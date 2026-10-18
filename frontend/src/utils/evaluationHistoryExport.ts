import type { StudentEvaluationHistoryItem } from '@/types/evaluationHistory';
import {
  formatScore,
  getSituationLabel,
  getStudentScore,
  getTutorScore,
} from './evaluationHistory';

export type ExportTable = { headers: string[]; rows: string[][] };

const CSV_SEPARATOR = ';';
// Excel only detects UTF-8 (accents in names) when the file starts with a BOM.
const UTF8_BOM = '﻿';

function formatExportScore(value: number | null): string {
  return value === null ? '' : formatScore(value);
}

// When names are hidden on screen, the export omits them too.
export function buildExportTable(
  items: StudentEvaluationHistoryItem[],
  hideNames: boolean,
): ExportTable {
  const nameHeader = hideNames ? [] : ['Nome'];
  const headers = ['Matrícula', ...nameHeader, 'Nota do aluno', 'Nota do tutor', 'Situação'];
  const rows = items.map((item) => [
    item.matricula ?? '',
    ...(hideNames ? [] : [item.nome]),
    formatExportScore(getStudentScore(item)),
    formatExportScore(getTutorScore(item)),
    getSituationLabel(item),
  ]);
  return { headers, rows };
}

function escapeCsvCell(value: string): string {
  return /[";\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export function toCsv({ headers, rows }: ExportTable): string {
  const lines = [headers, ...rows].map((cells) => cells.map(escapeCsvCell).join(CSV_SEPARATOR));
  return `${UTF8_BOM}${lines.join('\r\n')}`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const PRINT_STYLES = `
  body { font-family: Inter, Arial, sans-serif; color: #10214c; margin: 24px; }
  h1 { font-size: 20px; margin: 0 0 4px; color: #000077; }
  p { font-size: 12px; margin: 0 0 16px; color: #5f5e5a; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th, td { border: 1px solid #d0d3dc; padding: 6px 8px; text-align: left; }
  th { background: #eeeefb; }
`;

export function toPrintHtml(table: ExportTable, title: string, generatedAt: Date): string {
  const head = table.headers.map((cell) => `<th>${escapeHtml(cell)}</th>`).join('');
  const body = table.rows
    .map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`)
    .join('');
  const date = generatedAt.toLocaleString('pt-BR');
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${escapeHtml(title)}</title><style>${PRINT_STYLES}</style></head><body><h1>${escapeHtml(title)}</h1><p>Gerado em ${date}</p><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></body></html>`;
}

export function exportFileName(extension: string, date: Date): string {
  return `historico-avaliacoes-${date.toISOString().slice(0, 10)}.${extension}`;
}
