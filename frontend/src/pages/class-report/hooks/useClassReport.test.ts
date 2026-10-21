import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { classReportService } from '@/services/class-report.service';
import { ApiError } from '@/services/apiError';
import { useClassReport } from './useClassReport';

describe('useClassReport', () => {
  let getFinalReportSpy: ReturnType<typeof vi.spyOn>;

  const mockReport = {
    sala: {
      id: 'room-1',
      nome: 'Engenharia de Software',
      codigoDisciplina: 'EXA123',
      semestre: '2026.2',
    },
    problemas: [],
    alunos: [],
  };

  beforeEach(() => {
    getFinalReportSpy = vi.spyOn(classReportService, 'getFinalReport');
  });

  afterEach(() => {
    getFinalReportSpy.mockRestore();
  });

  it('fetches class report on mount when roomId is provided', async () => {
    vi.mocked(classReportService.getFinalReport).mockResolvedValueOnce(mockReport);

    const { result } = renderHook(() => useClassReport('room-1'));

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual(mockReport);
    expect(result.current.error).toBeNull();
    expect(classReportService.getFinalReport).toHaveBeenCalledWith('room-1');
  });

  it('handles 403 Forbidden with permission error message', async () => {
    vi.mocked(classReportService.getFinalReport).mockRejectedValueOnce(
      new ApiError(403, ['Forbidden']),
    );

    const { result } = renderHook(() => useClassReport('room-1'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBe(
      'Você não possui permissão para acessar o relatório final desta turma.',
    );
  });

  it('handles 404 Not Found error message', async () => {
    vi.mocked(classReportService.getFinalReport).mockRejectedValueOnce(
      new ApiError(404, ['Not Found']),
    );

    const { result } = renderHook(() => useClassReport('room-1'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Turma não encontrada.');
  });

  it('allows refetching data', async () => {
    vi.mocked(classReportService.getFinalReport)
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce(mockReport);

    const { result } = renderHook(() => useClassReport('room-1'));

    await waitFor(() => {
      expect(result.current.error).not.toBeNull();
    });

    act(() => {
      result.current.refetch();
    });

    await waitFor(() => {
      expect(result.current.data).toEqual(mockReport);
    });

    expect(classReportService.getFinalReport).toHaveBeenCalledTimes(2);
  });
});
