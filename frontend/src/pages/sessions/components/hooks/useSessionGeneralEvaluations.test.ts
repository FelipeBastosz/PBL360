import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { sessionService } from '@/services/session.service';
import type { SessionGeneralEvaluation } from '@/types/session';
import { useSessionGeneralEvaluations } from './useSessionGeneralEvaluations';

vi.mock('@/services/session.service', () => ({
  sessionService: {
    getGeneralEvaluations: vi.fn(),
  },
}));

const mockEvaluation: SessionGeneralEvaluation = {
  id: 'eval-1',
  texto: 'Excelente turma.',
  autor: { id: 'prof-1', nome: 'Prof. Carlos' },
  criadoEm: '2026-04-12T10:00:00Z',
  editadoEm: null,
};

describe('useSessionGeneralEvaluations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches and returns evaluations for sessionId', async () => {
    vi.mocked(sessionService.getGeneralEvaluations).mockResolvedValueOnce([mockEvaluation]);

    const { result } = renderHook(() => useSessionGeneralEvaluations('sess-1'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.evaluations).toEqual([mockEvaluation]);
    expect(result.current.error).toBeNull();
  });

  it('sets error on fetch failure', async () => {
    vi.mocked(sessionService.getGeneralEvaluations).mockRejectedValueOnce(
      new Error('Erro ao carregar'),
    );

    const { result } = renderHook(() => useSessionGeneralEvaluations('sess-1'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Erro ao carregar');
    expect(result.current.evaluations).toEqual([]);
  });

  it('reloads evaluations when reload is called', async () => {
    vi.mocked(sessionService.getGeneralEvaluations)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([mockEvaluation]);

    const { result } = renderHook(() => useSessionGeneralEvaluations('sess-1'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.evaluations).toEqual([]);

    await act(async () => {
      result.current.reload();
    });

    await waitFor(() => {
      expect(result.current.evaluations).toEqual([mockEvaluation]);
    });
  });
});
