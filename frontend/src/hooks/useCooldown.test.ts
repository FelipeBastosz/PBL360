import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useCooldown } from './useCooldown';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useCooldown', () => {
  it('counts down one second at a time until it is over', () => {
    const { result } = renderHook(() => useCooldown(2));

    act(() => result.current.start());
    expect(result.current).toMatchObject({ remaining: 2, isCoolingDown: true });

    act(() => vi.advanceTimersByTime(1000));
    expect(result.current.remaining).toBe(1);

    act(() => vi.advanceTimersByTime(1000));
    expect(result.current).toMatchObject({ remaining: 0, isCoolingDown: false });
  });
});
