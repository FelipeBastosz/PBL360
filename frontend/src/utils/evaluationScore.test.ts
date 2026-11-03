import { describe, expect, it } from 'vitest';
import { calculateSessionScore, getRolePercentage } from './evaluationScore';

describe('evaluationScore', () => {
  describe('getRolePercentage', () => {
    it('returns 30% by default when formula is undefined', () => {
      expect(getRolePercentage()).toBe(30);
    });

    it('calculates custom formula percentage accurately', () => {
      expect(getRolePercentage({ criteriaWeight: 80, roleWeight: 20 })).toBe(20);
      expect(getRolePercentage({ criteriaWeight: 60, roleWeight: 40 })).toBe(40);
      expect(getRolePercentage({ criteriaWeight: 7, roleWeight: 3 })).toBe(30);
      expect(getRolePercentage({ criteriaWeight: 50, roleWeight: 50 })).toBe(50);
    });

    it('handles zero total gracefully', () => {
      expect(getRolePercentage({ criteriaWeight: 0, roleWeight: 0 })).toBe(30);
    });
  });

  describe('calculateSessionScore', () => {
    const criteria = [
      { id: 'c1', nome: 'Critério 1', peso: 2, ordem: 1 },
      { id: 'c2', nome: 'Critério 2', peso: 3, ordem: 2 },
    ];

    it('calculates weighted criteria score when no role score is present', () => {
      // (8 * 2 + 6 * 3) / (2 + 3) = (16 + 18) / 5 = 34 / 5 = 6.8
      const scores = { c1: 8, c2: 6 };
      expect(calculateSessionScore({ criteria, scores })).toBe(6.8);
    });

    it('calculates score with default 70/30 formula when student has role and role score', () => {
      // Criteria average = 6.8
      // Role score = 10
      // (6.8 * 70 + 10 * 30) / 100 = (476 + 300) / 100 = 7.76 -> 7.8
      const scores = { c1: 8, c2: 6 };
      expect(
        calculateSessionScore({
          criteria,
          scores,
          roleScore: 10,
          hasRole: true,
        }),
      ).toBe(7.8);
    });

    it('uses custom formula if provided', () => {
      // Criteria average = 6.8
      // Role score = 10
      // Formula: 60% criteria / 40% role
      // (6.8 * 60 + 10 * 40) / 100 = (408 + 400) / 100 = 8.08 -> 8.1
      const scores = { c1: 8, c2: 6 };
      expect(
        calculateSessionScore({
          criteria,
          scores,
          roleScore: 10,
          formula: { criteriaWeight: 60, roleWeight: 40 },
          hasRole: true,
        }),
      ).toBe(8.1);
    });

    it('ignores roleScore if hasRole is false', () => {
      const scores = { c1: 8, c2: 6 };
      expect(
        calculateSessionScore({
          criteria,
          scores,
          roleScore: 10,
          hasRole: false,
        }),
      ).toBe(6.8);
    });

    it('applies formula with default 0 role score when student has role but roleScore is null or omitted', () => {
      // 1 criterion with 10. Default formula 70/30.
      // Criteria avg = 10, Role = 0 -> (10 * 70 + 0 * 30) / 100 = 7.0
      expect(
        calculateSessionScore({
          criteria: [{ id: 'c1', nome: 'Critério 1', peso: 1, ordem: 1 }],
          scores: { c1: 10 },
          roleScore: null,
          hasRole: true,
        }),
      ).toBe(7);

      expect(
        calculateSessionScore({
          criteria: [{ id: 'c1', nome: 'Critério 1', peso: 1, ordem: 1 }],
          scores: { c1: 10 },
          hasRole: true,
        }),
      ).toBe(7);
    });

    it('returns 0 if criteria weights sum to 0', () => {
      expect(
        calculateSessionScore({
          criteria: [{ id: 'c1', nome: 'C1', peso: 0, ordem: 1 }],
          scores: { c1: 10 },
        }),
      ).toBe(0);
    });
  });
});
