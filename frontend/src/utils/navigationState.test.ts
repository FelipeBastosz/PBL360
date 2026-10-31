import { beforeEach, describe, expect, it } from 'vitest';
import { clearApplyTarget, readApplyTarget, readStringFields } from './navigationState';

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

describe('readApplyTarget and clearApplyTarget', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('reads target from state and persists to sessionStorage', () => {
    const target = readApplyTarget({
      sessionId: 'session-1',
      roomId: 'room-1',
      problemId: 'prob-1',
    });

    expect(target).toEqual({
      sessionId: 'session-1',
      roomId: 'room-1',
      problemId: 'prob-1',
    });
    expect(sessionStorage.getItem('pbl360_apply_target')).toBe(JSON.stringify(target));
  });

  it('falls back to sessionStorage when state is null', () => {
    sessionStorage.setItem(
      'pbl360_apply_target',
      JSON.stringify({
        sessionId: 'session-cached',
        roomId: 'room-cached',
        problemId: 'prob-cached',
      }),
    );

    const target = readApplyTarget(null);
    expect(target).toEqual({
      sessionId: 'session-cached',
      roomId: 'room-cached',
      problemId: 'prob-cached',
    });
  });

  it('clears sessionStorage and returns null when clearTarget is true', () => {
    sessionStorage.setItem(
      'pbl360_apply_target',
      JSON.stringify({ sessionId: 'session-cached', roomId: '', problemId: '' }),
    );

    const target = readApplyTarget({ clearTarget: true });
    expect(target).toBeNull();
    expect(sessionStorage.getItem('pbl360_apply_target')).toBeNull();
  });

  it('clearApplyTarget removes stored target from sessionStorage', () => {
    sessionStorage.setItem(
      'pbl360_apply_target',
      JSON.stringify({ sessionId: 'session-cached', roomId: '', problemId: '' }),
    );

    clearApplyTarget();
    expect(sessionStorage.getItem('pbl360_apply_target')).toBeNull();
  });
});
