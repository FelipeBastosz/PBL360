import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/services/apiError';
import { studentPerformanceService } from '@/services/studentPerformance.service';
import type { StudentPerformance } from '@/types/studentPerformance';
import { useStudentPerformance } from './useStudentPerformance';

vi.mock('@/services/studentPerformance.service', () => ({
  studentPerformanceService: { get: vi.fn() },
}));

const getPerformance = vi.mocked(studentPerformanceService.get);

const performanceOf = (id: string, nome: string): StudentPerformance => ({
  sala: { id: 'room-1', nome: 'Turma A' },
  aluno: { id, nome },
  sessoes: [],
});

describe('useStudentPerformance', () => {
  beforeEach(() => vi.clearAllMocks());

  it('loads the performance of the student with the problem filter', async () => {
    getPerformance.mockResolvedValue(performanceOf('s1', 'Ana'));

    const { result } = renderHook(() =>
      useStudentPerformance({ roomId: 'room-1', studentId: 's1', problemId: 'p2' }),
    );

    await waitFor(() => expect(result.current.performance?.aluno.nome).toBe('Ana'));
    expect(getPerformance).toHaveBeenCalledWith('room-1', 's1', 'p2');
  });

  it('drops the previous student while the next one loads', async () => {
    getPerformance.mockResolvedValueOnce(performanceOf('s1', 'Ana'));
    const { result, rerender } = renderHook(
      ({ studentId }) => useStudentPerformance({ roomId: 'room-1', studentId, problemId: null }),
      { initialProps: { studentId: 's1' } },
    );
    await waitFor(() => expect(result.current.performance?.aluno.nome).toBe('Ana'));

    getPerformance.mockReturnValueOnce(new Promise(() => {}));
    rerender({ studentId: 's2' });

    expect(result.current.performance).toBeNull();
  });

  it('exposes the API error and loads again on reload', async () => {
    getPerformance
      .mockRejectedValueOnce(new ApiError(500, ['Falhou']))
      .mockResolvedValueOnce(performanceOf('s1', 'Ana'));
    const { result } = renderHook(() =>
      useStudentPerformance({ roomId: 'room-1', studentId: 's1', problemId: null }),
    );
    await waitFor(() => expect(result.current.error?.message).toBe('Falhou'));

    act(() => result.current.reload());

    await waitFor(() => expect(result.current.performance?.aluno.nome).toBe('Ana'));
    expect(result.current.error).toBeNull();
  });
});
