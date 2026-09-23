import { describe, expect, it } from 'vitest';
import { parseProfileParam, profileLabel, toProfileParam } from './profile';

describe('profile helpers', () => {
  it('maps the query param to the API profile, ignoring case', () => {
    expect(parseProfileParam('aluno')).toBe('ALUNO');
    expect(parseProfileParam('Professor')).toBe('PROFESSOR');
  });

  it('returns null for a missing or unknown param', () => {
    expect(parseProfileParam(null)).toBeNull();
    expect(parseProfileParam('diretor')).toBeNull();
  });

  it('maps the API profile back to the query param and to its label', () => {
    expect(toProfileParam('ALUNO')).toBe('aluno');
    expect(profileLabel('PROFESSOR')).toBe('Professor');
  });
});
