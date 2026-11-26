import { afterEach, describe, expect, it } from 'vitest';
import {
  clearApplyTarget,
  hasSessionTarget,
  readApplyTarget,
  readStringFields,
} from './navigationState';

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
  afterEach(() => sessionStorage.clear());

  it('reads the session a table is applied to and remembers it', () => {
    const state = { sessionId: 'session-1', roomId: 'room-1', problemId: 'problem-1' };

    expect(readApplyTarget(state)).toEqual(state);
    expect(readApplyTarget(null)).toEqual(state);
  });

  it('returns null without a session in the state or in memory', () => {
    expect(readApplyTarget({ roomId: 'room-1' })).toBeNull();
    expect(readApplyTarget(null)).toBeNull();
  });

  it('forgets the remembered session once the flow is cleared', () => {
    readApplyTarget({ sessionId: 'session-1' });

    clearApplyTarget();

    expect(readApplyTarget(null)).toBeNull();
  });
});

describe('hasSessionTarget', () => {
  it('tells whether the navigation state carries a session', () => {
    expect(hasSessionTarget({ sessionId: 'session-1' })).toBe(true);
    expect(hasSessionTarget({ sessionId: ' ' })).toBe(false);
    expect(hasSessionTarget({ roomId: 'room-1' })).toBe(false);
    expect(hasSessionTarget({ nome: 'Barema', target: { sessionId: 'session-1' } })).toBe(true);
    expect(hasSessionTarget({ nome: 'Barema', target: { roomId: 'room-1' } })).toBe(false);
    expect(hasSessionTarget(null)).toBe(false);
  });
});
