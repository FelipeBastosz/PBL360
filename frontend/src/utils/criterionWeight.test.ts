import { describe, expect, it } from 'vitest';
import {
  formatCriterionWeight,
  formatWeightChange,
  isBalancedWeight,
  parseCriterionWeight,
  stepCriterionWeight,
  sumCriterionWeights,
  validateCriterion,
} from './criterionWeight';

describe('criterionWeight utils', () => {
  describe('formatCriterionWeight', () => {
    it('formats integers without decimals', () => {
      expect(formatCriterionWeight(0)).toBe('0');
      expect(formatCriterionWeight(5)).toBe('5');
      expect(formatCriterionWeight(10)).toBe('10');
    });

    it('formats decimals with comma and at most one decimal place', () => {
      expect(formatCriterionWeight(2.5)).toBe('2,5');
      expect(formatCriterionWeight(0.1)).toBe('0,1');
      expect(formatCriterionWeight(7.8)).toBe('7,8');
      expect(formatCriterionWeight(2.55)).toBe('2,6');
    });

    it('handles null, undefined and non-finite values gracefully', () => {
      expect(formatCriterionWeight(null)).toBe('');
      expect(formatCriterionWeight(undefined)).toBe('');
      expect(formatCriterionWeight(NaN)).toBe('');
      expect(formatCriterionWeight(Infinity)).toBe('');
    });
  });

  describe('parseCriterionWeight', () => {
    it('parses integers and decimals with comma or dot', () => {
      expect(parseCriterionWeight('5')).toBe(5);
      expect(parseCriterionWeight('2,5')).toBe(2.5);
      expect(parseCriterionWeight('2.5')).toBe(2.5);
      expect(parseCriterionWeight(',5')).toBe(0.5);
      expect(parseCriterionWeight('.5')).toBe(0.5);
      expect(parseCriterionWeight('0')).toBe(0);
      expect(parseCriterionWeight('10')).toBe(10);
    });

    it('rounds to one decimal place', () => {
      expect(parseCriterionWeight('2,55')).toBe(2.6);
      expect(parseCriterionWeight('2.55')).toBe(2.6);
    });

    it('returns null for empty or invalid input', () => {
      expect(parseCriterionWeight('')).toBeNull();
      expect(parseCriterionWeight('   ')).toBeNull();
      expect(parseCriterionWeight('abc')).toBeNull();
    });
  });

  describe('formatWeightChange', () => {
    it('allows valid inputs, converts dot to comma and formats correctly', () => {
      expect(formatWeightChange('')).toBe('');
      expect(formatWeightChange('5')).toBe('5');
      expect(formatWeightChange('10')).toBe('10');
      expect(formatWeightChange('10,')).toBe('10,');
      expect(formatWeightChange('10,0')).toBe('10,0');
      expect(formatWeightChange('3.5')).toBe('3,5');
      expect(formatWeightChange('3,5')).toBe('3,5');
      expect(formatWeightChange('3.55')).toBe('3,5');
    });

    it('normalizes leading zeros', () => {
      expect(formatWeightChange('0')).toBe('0');
      expect(formatWeightChange('00')).toBe('0');
      expect(formatWeightChange('005')).toBe('5');
      expect(formatWeightChange('05')).toBe('5');
      expect(formatWeightChange('0,5')).toBe('0,5');
      expect(formatWeightChange('00,5')).toBe('0,5');
    });

    it('blocks typing when value exceeds 10', () => {
      expect(formatWeightChange('15')).toBeNull();
      expect(formatWeightChange('99')).toBeNull();
      expect(formatWeightChange('10,5')).toBeNull();
      expect(formatWeightChange('10.1')).toBeNull();
    });

    it('returns null when invalid non-numeric input', () => {
      expect(formatWeightChange('-1')).toBeNull();
      expect(formatWeightChange('abc')).toBeNull();
    });
  });

  describe('stepCriterionWeight', () => {
    it('increments and decrements within bounds 0 and 10', () => {
      expect(stepCriterionWeight('5', 1)).toBe('6');
      expect(stepCriterionWeight('5', -1)).toBe('4');
      expect(stepCriterionWeight('9,5', 1)).toBe('10');
      expect(stepCriterionWeight('0,5', -1)).toBe('0');
      expect(stepCriterionWeight('10', 1)).toBe('10');
      expect(stepCriterionWeight('0', -1)).toBe('0');
    });
  });

  describe('validateCriterion', () => {
    it('returns error when nome is empty', () => {
      expect(validateCriterion('', '5')).toBe('O nome do critério é obrigatório.');
      expect(validateCriterion('   ', '5')).toBe('O nome do critério é obrigatório.');
    });

    it('returns error when peso is empty', () => {
      expect(validateCriterion('Critério', '')).toBe('O peso do critério é obrigatório.');
      expect(validateCriterion('Critério', '   ')).toBe('O peso do critério é obrigatório.');
    });

    it('returns error when peso is outside bounds or invalid', () => {
      expect(validateCriterion('Critério', '-1')).toBe(
        'O peso do critério deve estar entre 0 e 10.',
      );
      expect(validateCriterion('Critério', '11')).toBe(
        'O peso do critério deve estar entre 0 e 10.',
      );
      expect(validateCriterion('Critério', 'abc')).toBe(
        'O peso do critério deve estar entre 0 e 10.',
      );
    });

    it('returns null when criterion is valid', () => {
      expect(validateCriterion('Critério', '0')).toBeNull();
      expect(validateCriterion('Critério', '5')).toBeNull();
      expect(validateCriterion('Critério', '10')).toBeNull();
      expect(validateCriterion('Critério', '2,5')).toBeNull();
    });
  });

  describe('sumCriterionWeights and isBalancedWeight', () => {
    it('sums criteria weights with rounding', () => {
      expect(sumCriterionWeights([{ peso: 3.3 }, { peso: 3.3 }, { peso: 3.4 }])).toBe(10);
      expect(sumCriterionWeights([2.5, 2.5])).toBe(5);
      expect(sumCriterionWeights([])).toBe(0);
      expect(sumCriterionWeights([{ peso: 0.1 }, { peso: 0.2 }])).toBe(0.3);
    });

    it('validates if total weight is balanced at 10', () => {
      expect(isBalancedWeight(10)).toBe(true);
      expect(isBalancedWeight(9.99999999)).toBe(true);
      expect(isBalancedWeight(9.9)).toBe(false);
      expect(isBalancedWeight(10.1)).toBe(false);
      expect(isBalancedWeight(0)).toBe(false);
    });
  });
});
