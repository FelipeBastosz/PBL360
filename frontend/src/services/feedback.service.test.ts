import { describe, expect, it, vi, beforeEach } from 'vitest';
import { api } from './api';
import { feedbackService } from './feedback.service';

vi.mock('./api', () => ({
  api: {
    get: vi.fn(),
    put: vi.fn(),
  },
}));

describe('feedbackService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches session feedback for the student', async () => {
    const mockData = {
      id: 'fb-1',
      autor: { id: 'tutor-1', nome: 'Prof. Silva' },
      texto: 'Ótima participação na discussão.',
      criadoEm: '2026-03-20T10:00:00Z',
      editadoEm: null,
      novo: true,
    };
    vi.mocked(api.get).mockResolvedValueOnce({ data: mockData });

    const result = await feedbackService.getMySessionFeedback('sess-1');

    expect(api.get).toHaveBeenCalledWith('/sessoes/sess-1/meu-feedback');
    expect(result).toEqual(mockData);
  });

  it('fetches problem feedbacks for the student', async () => {
    const mockData = {
      individual: {
        id: 'fb-ind',
        autor: { id: 'tutor-1', nome: 'Prof. Silva' },
        texto: 'Bom progresso geral.',
        criadoEm: '2026-03-21T10:00:00Z',
        editadoEm: null,
        novo: false,
        nota: 8.5,
      },
      geral: null,
      sessoes: [],
    };
    vi.mocked(api.get).mockResolvedValueOnce({ data: mockData });

    const result = await feedbackService.getMyProblemFeedbacks('room-1', 'prob-1');

    expect(api.get).toHaveBeenCalledWith('/salas/room-1/problemas/prob-1/meus-feedbacks');
    expect(result).toEqual(mockData);
  });
});
