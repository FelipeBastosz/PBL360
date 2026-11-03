import { renderHook, act } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { sessionService } from '@/services/session.service';
import { useSessionReportExport } from './useSessionReportExport';
import * as downloadModule from './sessionReportDownload';

vi.mock('@/services/session.service', () => ({
  sessionService: {
    exportSessionReport: vi.fn(),
  },
}));

const mockNotify = vi.fn();
vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({ notify: mockNotify }),
}));

describe('useSessionReportExport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(downloadModule, 'triggerBlobDownload').mockImplementation(() => {});
  });

  it('downloads PDF report forwarding export options and slug filename', async () => {
    const mockBlob = new Blob(['pdf-content'], { type: 'application/pdf' });
    vi.mocked(sessionService.exportSessionReport).mockResolvedValue(mockBlob);

    const { result } = renderHook(() => useSessionReportExport('sess-1', 'Sessão 1 - Abertura'));
    const options = { ocultarNome: true, mostrarFeedBack: false, mostrarMarcacoes: true };

    let success = false;
    await act(async () => {
      success = await result.current.handleDownload('PDF', options);
    });

    expect(success).toBe(true);
    expect(sessionService.exportSessionReport).toHaveBeenCalledWith('sess-1', 'PDF', options);
    expect(downloadModule.triggerBlobDownload).toHaveBeenCalledWith(
      mockBlob,
      'relatorio-sessao-sessao-1-abertura.pdf',
    );
  });

  it('downloads Excel report and manages isExportingExcel status with fallback filename', async () => {
    const mockBlob = new Blob(['xlsx-content']);
    vi.mocked(sessionService.exportSessionReport).mockResolvedValue(mockBlob);

    const { result } = renderHook(() => useSessionReportExport('sess-1'));

    let success = false;
    await act(async () => {
      success = await result.current.handleDownload('XLSX');
    });

    expect(success).toBe(true);
    expect(sessionService.exportSessionReport).toHaveBeenCalledWith('sess-1', 'XLSX', undefined);
    expect(downloadModule.triggerBlobDownload).toHaveBeenCalledWith(
      mockBlob,
      'relatorio-sessao-sess-1.xlsx',
    );
    expect(result.current.isExportingExcel).toBe(false);
  });

  it('notifies error and returns false when export fails', async () => {
    const error = new Error('Falha no download');
    vi.mocked(sessionService.exportSessionReport).mockRejectedValue(error);
    vi.spyOn(downloadModule, 'parseBlobError').mockResolvedValue('Erro ao gerar relatório');

    const { result } = renderHook(() => useSessionReportExport('sess-1'));

    let success = true;
    await act(async () => {
      success = await result.current.handleDownload('PDF');
    });

    expect(success).toBe(false);
    expect(mockNotify).toHaveBeenCalledWith({
      tone: 'error',
      message: 'Erro ao gerar relatório',
    });
    expect(result.current.isExportingPDF).toBe(false);
  });

  it('returns false immediately when sessionId is empty', async () => {
    const { result } = renderHook(() => useSessionReportExport(''));

    let success = true;
    await act(async () => {
      success = await result.current.handleDownload('PDF');
    });

    expect(success).toBe(false);
    expect(sessionService.exportSessionReport).not.toHaveBeenCalled();
  });
});
