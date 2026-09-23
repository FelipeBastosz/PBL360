import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ApiError } from '@/services/apiError';
import { useAsyncAction } from './useAsyncAction';

describe('useAsyncAction', () => {
  it('returns the data of a successful action', async () => {
    const { result } = renderHook(() => useAsyncAction(async (value: number) => value * 2));

    let outcome;
    await act(async () => {
      outcome = await result.current.run(21);
    });

    expect(outcome).toEqual({ ok: true, data: 42 });
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('exposes a failed action as an ApiError', async () => {
    const failure = new ApiError(401, ['E-mail ou senha inválidos.']);
    const { result } = renderHook(() =>
      useAsyncAction(async () => {
        throw failure;
      }),
    );

    await act(async () => {
      await result.current.run();
    });

    expect(result.current.error).toBe(failure);

    act(() => result.current.clearError());
    expect(result.current.error).toBeNull();
  });
});
