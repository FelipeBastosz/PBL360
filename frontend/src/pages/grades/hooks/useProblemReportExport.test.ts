import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { problemService } from '@/services/problem.service';
import { triggerBlobDownload } from '@/utils/download';
import { useProblemReportExport } from './useProblemReportExport';

const mockNotify = vi.fn();
vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({ notify: mockNotify }),
}));

vi.mock('@/services/problem.service', () => ({
  problemService: {
    exportReport: vi.fn(),
  },
}));

vi.mock('@/utils/download', () => ({
  triggerBlobDownload: vi.fn(),
  parseBlobError: vi.fn().mockResolvedValue('Erro de teste'),
}));

describe('useProblemReportExport', () => {
  const fakeBlob = new Blob(['pdf-data'], { type: 'application/pdf' });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('manages modal open and close states', () => {
    const { result } = renderHook(() =>
      useProblemReportExport('room-1', 'prob-1', 'Problema 1 - Abertura'),
    );

    expect(result.current.isModalOpen).toBe(false);
    expect(result.current.selectedFormat).toBeNull();

    act(() => {
      result.current.handleExport('PDF');
    });

    expect(result.current.isModalOpen).toBe(true);
    expect(result.current.selectedFormat).toBe('PDF');

    act(() => {
      result.current.closeModal();
    });

    expect(result.current.isModalOpen).toBe(false);
    expect(result.current.selectedFormat).toBeNull();
  });

  it('downloads file with formatted slug name on confirmExport', async () => {
    vi.mocked(problemService.exportReport).mockResolvedValue(fakeBlob);

    const { result } = renderHook(() =>
      useProblemReportExport('room-1', 'prob-1', 'Problema 1 - Prontuário Eletrônico'),
    );

    act(() => {
      result.current.handleExport('PDF');
    });

    let success = false;
    await act(async () => {
      success = await result.current.confirmExport({
        ocultarNomes: false,
        mostrarPendencias: true,
        mostrarMarcacoes: true,
        mostrarFeedback: true,
      });
    });

    expect(success).toBe(true);
    expect(problemService.exportReport).toHaveBeenCalledWith('room-1', 'prob-1', 'PDF', {
      ocultarNomes: false,
      mostrarPendencias: true,
      mostrarMarcacoes: true,
      mostrarFeedback: true,
    });
    expect(triggerBlobDownload).toHaveBeenCalledWith(
      fakeBlob,
      'relatorio-problema-problema-1-prontuario-eletronico.pdf',
    );
    expect(result.current.isModalOpen).toBe(false);
  });

  it('notifies error and preserves modal state when export fails', async () => {
    vi.mocked(problemService.exportReport).mockRejectedValue(new Error('Falha no download'));

    const { result } = renderHook(() => useProblemReportExport('room-1', 'prob-1', 'Problema 1'));

    act(() => {
      result.current.handleExport('XLSX');
    });

    let success = true;
    await act(async () => {
      success = await result.current.confirmExport({
        ocultarNomes: true,
        mostrarPendencias: false,
        mostrarMarcacoes: false,
        mostrarFeedback: false,
      });
    });

    expect(success).toBe(false);
    expect(mockNotify).toHaveBeenCalledWith({
      tone: 'error',
      message: 'Erro de teste',
    });
  });
});
