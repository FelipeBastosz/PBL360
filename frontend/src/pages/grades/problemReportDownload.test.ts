import { describe, expect, it } from 'vitest';
import { buildProblemReportFileName } from './problemReportDownload';

describe('problemReportDownload', () => {
  describe('buildProblemReportFileName', () => {
    it('builds clean filename using toSlug for problem title and PDF format', () => {
      const fileName = buildProblemReportFileName(
        'Problema 1 - Prontuário Eletrônico',
        'prob-1',
        'PDF',
      );
      expect(fileName).toBe('relatorio-problema-problema-1-prontuario-eletronico.pdf');
    });

    it('builds clean filename for XLSX format', () => {
      const fileName = buildProblemReportFileName(
        'Problema 2 — Avaliação Clínica',
        'prob-2',
        'XLSX',
      );
      expect(fileName).toBe('relatorio-problema-problema-2-avaliacao-clinica.xlsx');
    });

    it('falls back to problemId when title is empty or undefined', () => {
      expect(buildProblemReportFileName(undefined, 'custom-id', 'PDF')).toBe(
        'relatorio-problema-custom-id.pdf',
      );
      expect(buildProblemReportFileName('', '123', 'XLSX')).toBe('relatorio-problema-123.xlsx');
    });
  });
});
