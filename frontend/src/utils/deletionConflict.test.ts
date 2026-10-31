import { describe, expect, it } from 'vitest';
import { ApiError } from '@/services/apiError';
import { formatProblemDeletionConflict, formatSessionDeletionConflict } from './deletionConflict';

describe('deletionConflict', () => {
  describe('formatSessionDeletionConflict', () => {
    it('returns null for non-409 errors', () => {
      expect(formatSessionDeletionConflict(new ApiError(403, ['Forbidden']))).toBeNull();
      expect(formatSessionDeletionConflict(new ApiError(500, ['Server error']))).toBeNull();
      expect(formatSessionDeletionConflict(new Error('Generic error'))).toBeNull();
      expect(formatSessionDeletionConflict(null)).toBeNull();
    });

    it('formats multiple items with mixed genders correctly', () => {
      const error = new ApiError(409, ['Conflict'], {
        detalhes: { feedbacks: 3, avaliacoes: 5 },
      });
      expect(formatSessionDeletionConflict(error)).toBe(
        'Não é possível excluir: existem 3 feedbacks e 5 avaliações vinculados a esta sessão.',
      );
    });

    it('formats single masculine item (feedback) in singular', () => {
      const error = new ApiError(409, ['Conflict'], {
        detalhes: { feedbacks: 1 },
      });
      expect(formatSessionDeletionConflict(error)).toBe(
        'Não é possível excluir: existe 1 feedback vinculado a esta sessão.',
      );
    });

    it('formats single feminine item (avaliação) in singular', () => {
      const error = new ApiError(409, ['Conflict'], {
        detalhes: { avaliacoes: 1 },
      });
      expect(formatSessionDeletionConflict(error)).toBe(
        'Não é possível excluir: existe 1 avaliação vinculada a esta sessão.',
      );
    });

    it('formats all-feminine plural items with vinculadas', () => {
      const error = new ApiError(409, ['Conflict'], {
        detalhes: { avaliacoes: 2, chamada: 3 },
      });
      expect(formatSessionDeletionConflict(error)).toBe(
        'Não é possível excluir: existem 2 avaliações e 3 presenças vinculadas a esta sessão.',
      );
    });

    it('formats all possible session conflict items', () => {
      const error = new ApiError(409, ['Conflict'], {
        detalhes: {
          feedbacks: 2,
          avaliacoes: 3,
          chamada: 4,
          papeis: 1,
          observacoes: 5,
        },
      });
      expect(formatSessionDeletionConflict(error)).toBe(
        'Não é possível excluir: existem 2 feedbacks, 3 avaliações, 4 presenças, 1 papel atribuído e 5 observações vinculados a esta sessão.',
      );
    });

    it('falls back to error message if 409 has empty detalhes or all zeros', () => {
      const error = new ApiError(409, ['Mensagem customizada da API.'], {
        detalhes: { feedbacks: 0 },
      });
      expect(formatSessionDeletionConflict(error)).toBe('Mensagem customizada da API.');
    });
  });

  describe('formatProblemDeletionConflict', () => {
    it('returns null for non-409 errors', () => {
      expect(formatProblemDeletionConflict(new ApiError(404, ['Not found']))).toBeNull();
      expect(formatProblemDeletionConflict(new Error('Unknown'))).toBeNull();
    });

    it('formats single session conflict in singular', () => {
      const error = new ApiError(409, ['Conflict'], {
        detalhes: { sessoes: 1 },
      });
      expect(formatProblemDeletionConflict(error)).toBe(
        'Não é possível excluir: existe 1 sessão vinculada a este problema.',
      );
    });

    it('formats sessions, avaliações and notas (all feminine)', () => {
      const error = new ApiError(409, ['Conflict'], {
        detalhes: { sessoes: 3, avaliacoes: 12, notas: 24 },
      });
      expect(formatProblemDeletionConflict(error)).toBe(
        'Não é possível excluir: existem 3 sessões, 12 avaliações e 24 notas vinculadas a este problema.',
      );
    });

    it('formats mixed gender items for problem with vinculados', () => {
      const error = new ApiError(409, ['Conflict'], {
        detalhes: { sessoes: 2, feedbacks: 1 },
      });
      expect(formatProblemDeletionConflict(error)).toBe(
        'Não é possível excluir: existem 2 sessões e 1 feedback vinculados a este problema.',
      );
    });

    it('falls back to error message if 409 has empty detalhes', () => {
      const error = new ApiError(409, ['Problema não pode ser excluído.'], {});
      expect(formatProblemDeletionConflict(error)).toBe('Problema não pode ser excluído.');
    });
  });
});
