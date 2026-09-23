import { describe, expect, it } from 'vitest';
import { readStringFields } from './navigationState';

describe('readStringFields', () => {
  it('returns the state when every key holds a non-empty string', () => {
    expect(readStringFields({ email: 'ana@uefs.br', token: 'x' }, ['email', 'token'])).toEqual({
      email: 'ana@uefs.br',
      token: 'x',
    });
  });

  it('returns null when a key is missing, empty or not a string', () => {
    expect(readStringFields({ email: 'ana@uefs.br' }, ['email', 'token'])).toBeNull();
    expect(readStringFields({ email: '' }, ['email'])).toBeNull();
    expect(readStringFields({ email: 1 }, ['email'])).toBeNull();
  });

  it('returns null for a missing state', () => {
    expect(readStringFields(null, ['email'])).toBeNull();
    expect(readStringFields(undefined, ['email'])).toBeNull();
  });
});
