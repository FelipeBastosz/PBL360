import { describe, expect, it } from 'vitest';
import { readApplyTarget, readStringFields } from './navigationState';

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

describe('readApplyTarget', () => {
  it('reads the room and the problem a table is applied to', () => {
    expect(readApplyTarget({ roomId: 'room-1', problemId: 'problem-1' })).toEqual({
      roomId: 'room-1',
      problemId: 'problem-1',
    });
    expect(readApplyTarget({ roomId: 'room-1' })).toBeNull();
  });
});
