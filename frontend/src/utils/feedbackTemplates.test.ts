import { describe, expect, it } from 'vitest';
import {
  FEEDBACK_MAX_LENGTH,
  appendFeedbackTemplate,
  isFeedbackOverLimit,
} from './feedbackTemplates';

describe('feedbackTemplates utils', () => {
  describe('appendFeedbackTemplate', () => {
    it('returns the template text when current text is empty', () => {
      const result = appendFeedbackTemplate('', 'Demonstrou engajamento.');
      expect(result).toBe('Demonstrou engajamento.');
    });

    it('returns the template text when current text contains only whitespace', () => {
      const result = appendFeedbackTemplate('   \n  ', 'Demonstrou engajamento.');
      expect(result).toBe('Demonstrou engajamento.');
    });

    it('returns the current text untouched when template text is empty or whitespace', () => {
      expect(appendFeedbackTemplate('Texto anterior', '')).toBe('Texto anterior');
      expect(appendFeedbackTemplate('Texto anterior', '   ')).toBe('Texto anterior');
    });

    it('concatenates template with existing text separating with two newlines', () => {
      const result = appendFeedbackTemplate('Primeiro apontamento.', 'Demonstrou engajamento.');
      expect(result).toBe('Primeiro apontamento.\n\nDemonstrou engajamento.');
    });

    it('preserves existing text without double trailing spacing before separator', () => {
      const result = appendFeedbackTemplate(
        'Primeiro apontamento.   \n',
        'Demonstrou engajamento.',
      );
      expect(result).toBe('Primeiro apontamento.\n\nDemonstrou engajamento.');
    });
  });

  describe('isFeedbackOverLimit', () => {
    it('returns false when text is within limit', () => {
      expect(isFeedbackOverLimit('a'.repeat(2000))).toBe(false);
      expect(isFeedbackOverLimit('Curto')).toBe(false);
      expect(isFeedbackOverLimit('')).toBe(false);
    });

    it('returns true when text exceeds default limit of 2000 characters', () => {
      expect(isFeedbackOverLimit('a'.repeat(2001))).toBe(true);
    });

    it('supports custom maximum length', () => {
      expect(isFeedbackOverLimit('abc', 2)).toBe(true);
      expect(isFeedbackOverLimit('ab', 2)).toBe(false);
    });

    it('exports FEEDBACK_MAX_LENGTH equal to 2000', () => {
      expect(FEEDBACK_MAX_LENGTH).toBe(2000);
    });
  });
});
