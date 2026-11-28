import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useCriterionWeightInput } from './useCriterionWeightInput';

describe('useCriterionWeightInput', () => {
  it('initializes with default value 1 or passed value', () => {
    const { result: defaultResult } = renderHook(() => useCriterionWeightInput());
    expect(defaultResult.current.peso).toBe('1');

    const { result: customResult } = renderHook(() => useCriterionWeightInput('5,5'));
    expect(customResult.current.peso).toBe('5,5');
  });

  it('updates peso and calls onResetError on valid change', () => {
    const onResetError = vi.fn();
    const { result } = renderHook(() => useCriterionWeightInput('1', onResetError));

    act(() => {
      result.current.handleWeightChange('3,5');
    });

    expect(result.current.peso).toBe('3,5');
    expect(onResetError).toHaveBeenCalledTimes(1);
  });

  it('ignores invalid non-numeric change', () => {
    const onResetError = vi.fn();
    const { result } = renderHook(() => useCriterionWeightInput('2', onResetError));

    act(() => {
      result.current.handleWeightChange('abc');
    });

    expect(result.current.peso).toBe('2');
    expect(onResetError).not.toHaveBeenCalled();
  });

  it('increments and decrements with step and calls onResetError', () => {
    const onResetError = vi.fn();
    const { result } = renderHook(() => useCriterionWeightInput('4', onResetError));

    act(() => {
      result.current.handleWeightStep(1);
    });
    expect(result.current.peso).toBe('5');
    expect(onResetError).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.handleWeightStep(-1);
    });
    expect(result.current.peso).toBe('4');
    expect(onResetError).toHaveBeenCalledTimes(2);
  });

  it('handles arrow key down events', () => {
    const { result } = renderHook(() => useCriterionWeightInput('5'));
    const preventDefault = vi.fn();

    act(() => {
      result.current.handleWeightKeyDown({
        key: 'ArrowUp',
        preventDefault,
      } as unknown as React.KeyboardEvent<HTMLInputElement>);
    });
    expect(preventDefault).toHaveBeenCalled();
    expect(result.current.peso).toBe('6');

    act(() => {
      result.current.handleWeightKeyDown({
        key: 'ArrowDown',
        preventDefault,
      } as unknown as React.KeyboardEvent<HTMLInputElement>);
    });
    expect(result.current.peso).toBe('5');
  });
});
