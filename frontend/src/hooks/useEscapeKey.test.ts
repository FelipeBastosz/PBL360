import { renderHook } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { useEscapeKey } from './useEscapeKey';

describe('useEscapeKey', () => {
  it('calls onClose when Escape is pressed while open', async () => {
    const onClose = vi.fn();
    renderHook(() => useEscapeKey(true, onClose));

    await userEvent.keyboard('{Escape}');

    expect(onClose).toHaveBeenCalledOnce();
  });

  it('ignores other keys', async () => {
    const onClose = vi.fn();
    renderHook(() => useEscapeKey(true, onClose));

    await userEvent.keyboard('{Enter}a');

    expect(onClose).not.toHaveBeenCalled();
  });

  it('does nothing while closed or disabled', async () => {
    const onClose = vi.fn();
    renderHook(() => useEscapeKey(false, onClose));
    renderHook(() => useEscapeKey(true, onClose, true));

    await userEvent.keyboard('{Escape}');

    expect(onClose).not.toHaveBeenCalled();
  });

  it('stops listening once unmounted', async () => {
    const onClose = vi.fn();
    const { unmount } = renderHook(() => useEscapeKey(true, onClose));
    unmount();

    await userEvent.keyboard('{Escape}');

    expect(onClose).not.toHaveBeenCalled();
  });
});
