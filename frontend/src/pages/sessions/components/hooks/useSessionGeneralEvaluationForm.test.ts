import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { sessionService } from '@/services/session.service';
import type { SessionGeneralEvaluation } from '@/types/session';
import { useSessionGeneralEvaluationForm } from './useSessionGeneralEvaluationForm';

vi.mock('@/services/session.service', () => ({
  sessionService: {
    saveGeneralEvaluation: vi.fn(),
  },
}));

const mockNotify = vi.fn();
vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({ notify: mockNotify }),
}));

const mockEvaluation: SessionGeneralEvaluation = {
  id: 'eval-1',
  texto: 'Texto existente.',
  autor: { id: 'prof-1', nome: 'Prof. Carlos' },
  criadoEm: '2026-04-12T10:00:00Z',
  editadoEm: '2026-04-12T11:30:00Z',
};

describe('useSessionGeneralEvaluationForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with empty text when no existing evaluation', () => {
    const { result } = renderHook(() =>
      useSessionGeneralEvaluationForm({
        sessionId: 'sess-1',
        existingEvaluation: null,
        onSaved: vi.fn(),
        onClose: vi.fn(),
      }),
    );

    expect(result.current.texto).toBe('');
    expect(result.current.error).toBeNull();
    expect(result.current.apiError).toBeNull();
    expect(result.current.isSubmitting).toBe(false);
  });

  it('initializes with existing text and formatted date', () => {
    const { result } = renderHook(() =>
      useSessionGeneralEvaluationForm({
        sessionId: 'sess-1',
        existingEvaluation: mockEvaluation,
        onSaved: vi.fn(),
        onClose: vi.fn(),
      }),
    );

    expect(result.current.texto).toBe('Texto existente.');
    expect(result.current.lastEditedText).toMatch(/12\/04\/2026/);
  });

  it('sets error when text is empty or whitespace only', async () => {
    const { result } = renderHook(() =>
      useSessionGeneralEvaluationForm({
        sessionId: 'sess-1',
        existingEvaluation: null,
        onSaved: vi.fn(),
        onClose: vi.fn(),
      }),
    );

    act(() => {
      result.current.setTexto('   ');
    });

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent);
    });

    expect(result.current.error).toBe('O comentário geral é obrigatório.');
    expect(sessionService.saveGeneralEvaluation).not.toHaveBeenCalled();
  });

  it('sets error when text exceeds 2000 characters', async () => {
    const { result } = renderHook(() =>
      useSessionGeneralEvaluationForm({
        sessionId: 'sess-1',
        existingEvaluation: null,
        onSaved: vi.fn(),
        onClose: vi.fn(),
      }),
    );

    act(() => {
      result.current.setTexto('a'.repeat(2001));
    });

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent);
    });

    expect(result.current.error).toBe('O comentário geral deve ter no máximo 2000 caracteres.');
    expect(sessionService.saveGeneralEvaluation).not.toHaveBeenCalled();
  });

  it('submits trimmed text, calls onSaved and onClose on success', async () => {
    const onSaved = vi.fn();
    const onClose = vi.fn();
    vi.mocked(sessionService.saveGeneralEvaluation).mockResolvedValueOnce({
      ...mockEvaluation,
      texto: 'Novo parecer.',
    });

    const { result } = renderHook(() =>
      useSessionGeneralEvaluationForm({
        sessionId: 'sess-1',
        existingEvaluation: null,
        onSaved,
        onClose,
      }),
    );

    act(() => {
      result.current.setTexto('  Novo parecer.  ');
    });

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent);
    });

    expect(sessionService.saveGeneralEvaluation).toHaveBeenCalledWith('sess-1', {
      texto: 'Novo parecer.',
    });
    expect(mockNotify).toHaveBeenCalledWith(
      expect.objectContaining({ tone: 'success', message: 'Feedback geral salvo com sucesso!' }),
    );
    expect(onSaved).toHaveBeenCalledWith(expect.objectContaining({ texto: 'Novo parecer.' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('sets apiError and notifies error on submission rejection', async () => {
    vi.mocked(sessionService.saveGeneralEvaluation).mockRejectedValueOnce(
      new Error('Erro interno ao salvar parecer.'),
    );

    const { result } = renderHook(() =>
      useSessionGeneralEvaluationForm({
        sessionId: 'sess-1',
        existingEvaluation: null,
        onSaved: vi.fn(),
        onClose: vi.fn(),
      }),
    );

    act(() => {
      result.current.setTexto('Parecer qualquer.');
    });

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent);
    });

    expect(result.current.apiError).toBe('Erro interno ao salvar parecer.');
    expect(mockNotify).toHaveBeenCalledWith(
      expect.objectContaining({ tone: 'error', message: 'Erro interno ao salvar parecer.' }),
    );
  });
});
