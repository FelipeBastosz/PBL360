import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { feedbackService } from '@/services/feedback.service';
import { useFeedbackTemplates } from './useFeedbackTemplates';

vi.mock('@/services/feedback.service', () => ({
  feedbackService: {
    listTemplates: vi.fn(),
  },
}));

describe('useFeedbackTemplates', () => {
  const mockTemplates = [
    {
      id: 'tmpl-1',
      titulo: 'Boa participação e engajamento',
      texto: 'Demonstrou participação ativa durante a sessão tutorial.',
    },
    {
      id: 'tmpl-2',
      titulo: 'Necessidade de aprofundar argumentos',
      texto: 'Participou das discussões, mas deve aprofundar os argumentos.',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches and returns feedback templates on mount', async () => {
    vi.mocked(feedbackService.listTemplates).mockResolvedValueOnce(mockTemplates);

    const { result } = renderHook(() => useFeedbackTemplates());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.templates).toEqual([]);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.templates).toEqual(mockTemplates);
    expect(result.current.error).toBeNull();
    expect(feedbackService.listTemplates).toHaveBeenCalledTimes(1);
  });

  it('handles error gracefully when API fails', async () => {
    vi.mocked(feedbackService.listTemplates).mockRejectedValueOnce(
      new Error('Internal Server Error'),
    );

    const { result } = renderHook(() => useFeedbackTemplates());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.templates).toEqual([]);
    expect(result.current.error).toBe('Não foi possível carregar os modelos de feedback.');
  });

  it('allows manual reload of templates', async () => {
    vi.mocked(feedbackService.listTemplates)
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce(mockTemplates);

    const { result } = renderHook(() => useFeedbackTemplates());

    await waitFor(() => {
      expect(result.current.error).not.toBeNull();
    });

    await act(async () => {
      await result.current.reload();
    });

    expect(result.current.templates).toEqual(mockTemplates);
    expect(result.current.error).toBeNull();
    expect(feedbackService.listTemplates).toHaveBeenCalledTimes(2);
  });
});
