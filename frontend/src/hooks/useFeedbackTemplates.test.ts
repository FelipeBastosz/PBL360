import { renderHook, act } from '@testing-library/react';
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

  it('does not fetch on mount (on-demand loading)', () => {
    const { result } = renderHook(() => useFeedbackTemplates());

    expect(result.current.isLoading).toBe(false);
    expect(result.current.templates).toEqual([]);
    expect(feedbackService.listTemplates).not.toHaveBeenCalled();
  });

  it('fetches templates on demand via fetchTemplates', async () => {
    vi.mocked(feedbackService.listTemplates).mockResolvedValueOnce(mockTemplates);

    const { result } = renderHook(() => useFeedbackTemplates());

    await act(async () => {
      await result.current.fetchTemplates();
    });

    expect(result.current.templates).toEqual(mockTemplates);
    expect(result.current.error).toBeNull();
    expect(feedbackService.listTemplates).toHaveBeenCalledTimes(1);
  });

  it('ignores response if data is not an array', async () => {
    vi.mocked(feedbackService.listTemplates).mockResolvedValueOnce({
      invalid: 'payload',
    } as unknown as typeof mockTemplates);

    const { result } = renderHook(() => useFeedbackTemplates());

    await act(async () => {
      await result.current.fetchTemplates();
    });

    expect(result.current.templates).toEqual([]);
  });

  it('handles error gracefully when API fails', async () => {
    vi.mocked(feedbackService.listTemplates).mockRejectedValueOnce(
      new Error('Internal Server Error'),
    );

    const { result } = renderHook(() => useFeedbackTemplates());

    await act(async () => {
      await result.current.fetchTemplates();
    });

    expect(result.current.templates).toEqual([]);
    expect(result.current.error).toBe('Não foi possível carregar os modelos de feedback.');
  });

  it('supports reload alias for fetchTemplates', async () => {
    vi.mocked(feedbackService.listTemplates).mockResolvedValueOnce(mockTemplates);

    const { result } = renderHook(() => useFeedbackTemplates());

    await act(async () => {
      await result.current.reload();
    });

    expect(result.current.templates).toEqual(mockTemplates);
    expect(feedbackService.listTemplates).toHaveBeenCalledTimes(1);
  });
});
