import { describe, expect, it, vi } from 'vitest';
import { classReportService } from '@/services/class-report.service';
import * as downloadUtils from '@/utils/download';
import { buildClassReportFileName, performClassReportExport } from './classReportDownload';

describe('classReportDownload', () => {
  describe('buildClassReportFileName', () => {
    it('builds filename combining course code and room name in slug format', () => {
      expect(buildClassReportFileName('EXA123', 'Engenharia de Software', 'PDF')).toBe(
        'relatorio-final-exa123-engenharia-de-software.pdf',
      );
      expect(buildClassReportFileName('MED101', 'Turma A', 'XLSX')).toBe(
        'relatorio-final-med101-turma-a.xlsx',
      );
    });

    it('handles special characters and accents gracefully', () => {
      expect(buildClassReportFileName('BIO202', 'Laboratório de Fisiologia & Saúde', 'PDF')).toBe(
        'relatorio-final-bio202-laboratorio-de-fisiologia-saude.pdf',
      );
    });

    it('falls back to single part when one is missing', () => {
      expect(buildClassReportFileName(undefined, 'Turma A', 'PDF')).toBe(
        'relatorio-final-turma-a.pdf',
      );
      expect(buildClassReportFileName('EXA123', undefined, 'XLSX')).toBe(
        'relatorio-final-exa123.xlsx',
      );
    });

    it('falls back to fallbackId or default name when both are missing', () => {
      expect(buildClassReportFileName(undefined, undefined, 'PDF', 'room-123')).toBe(
        'relatorio-final-room-123.pdf',
      );
      expect(buildClassReportFileName(undefined, undefined, 'XLSX')).toBe('relatorio-final.xlsx');
    });
  });

  describe('performClassReportExport', () => {
    it('fetches report blob and triggers browser download with proper slug filename', async () => {
      const fakeBlob = new Blob(['pdf-data'], { type: 'application/pdf' });
      const exportSpy = vi
        .spyOn(classReportService, 'exportFinalReport')
        .mockResolvedValueOnce(fakeBlob);
      const downloadSpy = vi
        .spyOn(downloadUtils, 'triggerBlobDownload')
        .mockImplementation(() => {});

      await performClassReportExport('room-1', 'EXA123', 'Turma A', 'PDF', { ocultarNomes: true });

      expect(exportSpy).toHaveBeenCalledWith('room-1', 'PDF', { ocultarNomes: true });
      expect(downloadSpy).toHaveBeenCalledWith(fakeBlob, 'relatorio-final-exa123-turma-a.pdf');

      exportSpy.mockRestore();
      downloadSpy.mockRestore();
    });
  });
});
