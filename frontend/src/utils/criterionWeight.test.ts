import { describe, expect, it } from 'vitest';
import {
  formatCriterionWeight,
  formatWeightChange,
  parseCriterionWeight,
  sanitizeCriterionWeightInput,
  stepCriterionWeight,
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

  describe('sanitizeCriterionWeightInput', () => {
    it('allows empty string, integers and one decimal digit with comma', () => {
      expect(sanitizeCriterionWeightInput('')).toBe('');
      expect(sanitizeCriterionWeightInput('5')).toBe('5');
      expect(sanitizeCriterionWeightInput('10')).toBe('10');
      expect(sanitizeCriterionWeightInput('2,')).toBe('2,');
      expect(sanitizeCriterionWeightInput('2,5')).toBe('2,5');
    });

    it('converts dot to comma', () => {
      expect(sanitizeCriterionWeightInput('2.')).toBe('2,');
      expect(sanitizeCriterionWeightInput('2.5')).toBe('2,5');
    });

    it('truncates to at most one decimal place and rejects non-numeric characters', () => {
      expect(sanitizeCriterionWeightInput('2,55')).toBe('2,5');
      expect(sanitizeCriterionWeightInput('2.55')).toBe('2,5');
      expect(sanitizeCriterionWeightInput('-1')).toBe('');
      expect(sanitizeCriterionWeightInput('abc')).toBe('');
    });
  });

  describe('formatWeightChange', () => {
    it('returns formatted text with comma and truncates to at most one decimal place', () => {
      expect(formatWeightChange('3.5')).toBe('3,5');
      expect(formatWeightChange('3,5')).toBe('3,5');
      expect(formatWeightChange('3.55')).toBe('3,5');
      expect(formatWeightChange('10')).toBe('10');
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
});
