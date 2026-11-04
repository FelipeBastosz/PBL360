import {
  calculateCriteriaScore,
  calculatePeerAverage,
  calculateTutorScore,
} from './evaluation-history-scores';

describe('evaluation-history-scores', () => {
  const criteria = [
    { id: 'crit-1', weight: 6 },
    { id: 'crit-2', weight: 4 },
  ];
  const formula = { criteriaWeight: 70, roleWeight: 30 };

  describe('calculateCriteriaScore', () => {
    it('returns null when items array is empty', () => {
      expect(calculateCriteriaScore([], criteria)).toBeNull();
    });

    it('calculates weighted criteria score', () => {
      const items = [
        { criterionId: 'crit-1', score: 10 },
        { criterionId: 'crit-2', score: 8 },
      ];
      // (10*6 + 8*4) / 10 = 92 / 10 = 9.2
      expect(calculateCriteriaScore(items, criteria)).toBe(9.2);
    });

    it('returns null when total weight is zero', () => {
      const zeroCriteria = [
        { id: 'crit-1', weight: 0 },
        { id: 'crit-2', weight: 0 },
      ];
      const items = [{ criterionId: 'crit-1', score: 10 }];
      expect(calculateCriteriaScore(items, zeroCriteria)).toBeNull();
    });
  });

  describe('calculateTutorScore', () => {
    it('returns null when items array is empty', () => {
      expect(calculateTutorScore([], { criteria, formula }, 10)).toBeNull();
    });

    it('returns criteria score when bonus is null', () => {
      const items = [
        { criterionId: 'crit-1', score: 10 },
        { criterionId: 'crit-2', score: 8 },
      ];
      expect(calculateTutorScore(items, { criteria, formula }, null)).toBe(9.2);
    });

    it('calculates weighted score applying formula when bonus is provided', () => {
      const items = [
        { criterionId: 'crit-1', score: 10 },
        { criterionId: 'crit-2', score: 8 },
      ];
      // criteria: 9.2 * 0.7 = 6.44; cargo: 10 * 0.3 = 3.0; total = 9.44
      expect(calculateTutorScore(items, { criteria, formula }, 10)).toBe(9.44);
    });

    it('calculates correctly when bonus is 0', () => {
      const items = [
        { criterionId: 'crit-1', score: 10 },
        { criterionId: 'crit-2', score: 8 },
      ];
      // criteria: 9.2 * 0.7 = 6.44; cargo: 0 * 0.3 = 0; total = 6.44
      expect(calculateTutorScore(items, { criteria, formula }, 0)).toBe(6.44);
    });

    it('supports custom formula weights', () => {
      const customFormula = { criteriaWeight: 80, roleWeight: 20 };
      const items = [
        { criterionId: 'crit-1', score: 10 },
        { criterionId: 'crit-2', score: 8 },
      ];
      // criteria: 9.2 * 0.8 = 7.36; cargo: 10 * 0.2 = 2.0; total = 9.36
      expect(calculateTutorScore(items, { criteria, formula: customFormula }, 10)).toBe(9.36);
    });

    it('handles fallback when items are partial', () => {
      const items = [{ criterionId: 'crit-1', score: 10 }];
      // criteria: 10 (weight 6 out of 6 present) -> 10.0; cargo: 5 * 0.3 = 1.5; 10*0.7 = 7.0; total = 8.5
      expect(calculateTutorScore(items, { criteria, formula }, 5)).toBe(8.5);
    });
  });

  describe('calculatePeerAverage', () => {
    it('returns null when scores array is empty', () => {
      expect(calculatePeerAverage([])).toBeNull();
    });

    it('calculates average rounded to 2 decimals', () => {
      expect(calculatePeerAverage([8, 9, 10])).toBe(9);
      expect(calculatePeerAverage([7, 8])).toBe(7.5);
    });
  });
});
