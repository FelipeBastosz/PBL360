import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { classReportService } from '@/services/class-report.service';
import { triggerBlobDownload } from '@/utils/download';
import { useClassReportExport } from './useClassReportExport';

const mockNotify = vi.fn();
vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({ notify: mockNotify }),
}));

vi.mock('@/services/class-report.service', () => ({
  classReportService: {
    exportFinalReport: vi.fn(),
  },
}));

vi.mock('@/utils/download', () => ({
  triggerBlobDownload: vi.fn(),
  parseBlobError: vi.fn().mockResolvedValue('Erro de teste'),
}));

describe('useClassReportExport', () => {
  const fakeBlob = new Blob(['pdf-data'], { type: 'application/pdf' });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('manages modal open and close states', () => {
    const { result } = renderHook(() =>
      useClassReportExport('room-1', 'EXA123', 'Engenharia de Software'),
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
    vi.mocked(classReportService.exportFinalReport).mockResolvedValue(fakeBlob);

    const { result } = renderHook(() =>
      useClassReportExport('room-1', 'EXA123', 'Engenharia de Software'),
    );

    act(() => {
      result.current.handleExport('PDF');
    });

    let success = false;
    await act(async () => {
      success = await result.current.confirmExport({ ocultarNomes: false });
    });

    expect(success).toBe(true);
    expect(classReportService.exportFinalReport).toHaveBeenCalledWith('room-1', 'PDF', {
      ocultarNomes: false,
    });
    expect(triggerBlobDownload).toHaveBeenCalledWith(
      fakeBlob,
      'relatorio-final-exa123-engenharia-de-software.pdf',
    );
    expect(result.current.isModalOpen).toBe(false);
  });

  it('downloads file with ocultarNomes: true when option is passed', async () => {
    vi.mocked(classReportService.exportFinalReport).mockResolvedValue(fakeBlob);

    const { result } = renderHook(() => useClassReportExport('room-1', 'MED101', 'Turma A'));

    act(() => {
      result.current.handleExport('XLSX');
    });

    let success = false;
    await act(async () => {
      success = await result.current.confirmExport({ ocultarNomes: true });
    });

    expect(success).toBe(true);
    expect(classReportService.exportFinalReport).toHaveBeenCalledWith('room-1', 'XLSX', {
      ocultarNomes: true,
    });
    expect(triggerBlobDownload).toHaveBeenCalledWith(
      fakeBlob,
      'relatorio-final-med101-turma-a.xlsx',
    );
    expect(result.current.isModalOpen).toBe(false);
  });

  it('notifies error and preserves modal state when export fails', async () => {
    vi.mocked(classReportService.exportFinalReport).mockRejectedValue(new Error('Falha'));

    const { result } = renderHook(() => useClassReportExport('room-1', 'EXA123', 'Turma A'));

    act(() => {
      result.current.handleExport('PDF');
    });

    let success = true;
    await act(async () => {
      success = await result.current.confirmExport({ ocultarNomes: false });
    });

    expect(success).toBe(false);
    expect(mockNotify).toHaveBeenCalledWith({
      tone: 'error',
      message: 'Erro de teste',
    });
  });
});
