import { describe, expect, it } from 'vitest';
import { buildSessionReportFileName } from './sessionReportDownload';
import { toSlug } from '@/utils/slug';

describe('sessionReportDownload', () => {
  describe('toSlug', () => {
    it('converts accented title to lower-cased hyphenated slug', () => {
      expect(toSlug('Sessão 1 - Abertura')).toBe('sessao-1-abertura');
    });

    it('handles complex accents, multiple spaces and symbols', () => {
      expect(toSlug('  Avaliação Clínica & Diagnóstico -- Final! ')).toBe(
        'avaliacao-clinica-diagnostico-final',
      );
    });
  });

  describe('buildSessionReportFileName', () => {
    it('returns filename with slug when title is provided', () => {
      expect(buildSessionReportFileName('Sessão 1 - Abertura', 'sess-1', 'PDF')).toBe(
        'relatorio-sessao-sessao-1-abertura.pdf',
      );
      expect(buildSessionReportFileName('Sessão 1 - Abertura', 'sess-1', 'XLSX')).toBe(
        'relatorio-sessao-sessao-1-abertura.xlsx',
      );
    });

    it('falls back to sessionId when title is undefined or empty', () => {
      expect(buildSessionReportFileName(undefined, 'sess-uuid-123', 'PDF')).toBe(
        'relatorio-sessao-sess-uuid-123.pdf',
      );
      expect(buildSessionReportFileName('', 'sess-uuid-123', 'XLSX')).toBe(
        'relatorio-sessao-sess-uuid-123.xlsx',
      );
    });
  });
});
