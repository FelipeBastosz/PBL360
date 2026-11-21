import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { userService } from '@/services/user.service';
import { clearUserPhotoCache, setUserPhotoCache, useUserPhoto } from './useUserPhoto';

vi.mock('@/services/user.service', () => ({
  userService: {
    getPhoto: vi.fn(),
  },
}));

describe('useUserPhoto', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearUserPhotoCache();
  });

  it('fetches and caches the photo across mounts', async () => {
    const blob = new Blob(['photo-1'], { type: 'image/png' });
    vi.mocked(userService.getPhoto).mockResolvedValue(blob);

    const first = renderHook(() => useUserPhoto('user-1', true));
    await waitFor(() => expect(first.result.current).toBe(blob));

    const second = renderHook(() => useUserPhoto('user-1', true));
    expect(second.result.current).toBe(blob);
    expect(userService.getPhoto).toHaveBeenCalledTimes(1);
  });

  it('does not fetch when hasPhoto is false', () => {
    const { result } = renderHook(() => useUserPhoto('user-1', false));

    expect(result.current).toBeNull();
    expect(userService.getPhoto).not.toHaveBeenCalled();
  });

  it('updates mounted consumers immediately when setUserPhotoCache is called', async () => {
    const initial = new Blob(['initial'], { type: 'image/png' });
    const replacement = new Blob(['replacement'], { type: 'image/jpeg' });
    vi.mocked(userService.getPhoto).mockResolvedValue(initial);

    const { result } = renderHook(() => useUserPhoto('user-1', true));
    await waitFor(() => expect(result.current).toBe(initial));

    act(() => {
      setUserPhotoCache('user-1', replacement);
    });

    expect(result.current).toBe(replacement);
  });

  it('clears cached photos on clearUserPhotoCache so next mount refetches', async () => {
    const firstBlob = new Blob(['first'], { type: 'image/png' });
    const secondBlob = new Blob(['second'], { type: 'image/png' });
    vi.mocked(userService.getPhoto)
      .mockResolvedValueOnce(firstBlob)
      .mockResolvedValueOnce(secondBlob);

    const first = renderHook(() => useUserPhoto('user-1', true));
    await waitFor(() => expect(first.result.current).toBe(firstBlob));
    first.unmount();

    act(() => {
      clearUserPhotoCache();
    });

    const second = renderHook(() => useUserPhoto('user-1', true));
    await waitFor(() => expect(second.result.current).toBe(secondBlob));
    expect(userService.getPhoto).toHaveBeenCalledTimes(2);
  });

  it('ignores stale in-flight responses if cache was cleared before resolution', async () => {
    let resolvePending!: (blob: Blob) => void;
    vi.mocked(userService.getPhoto).mockImplementationOnce(
      () =>
        new Promise<Blob>((resolve) => {
          resolvePending = resolve;
        }),
    );

    const { result, unmount } = renderHook(() => useUserPhoto('user-1', true));
    expect(userService.getPhoto).toHaveBeenCalledTimes(1);

    unmount();
    act(() => {
      clearUserPhotoCache();
    });

    const staleBlob = new Blob(['stale'], { type: 'image/png' });
    await act(async () => {
      resolvePending(staleBlob);
    });

    const freshBlob = new Blob(['fresh'], { type: 'image/png' });
    vi.mocked(userService.getPhoto).mockResolvedValueOnce(freshBlob);
    const next = renderHook(() => useUserPhoto('user-1', true));
    await waitFor(() => expect(next.result.current).toBe(freshBlob));
    expect(result.current).toBeNull();
  });

  it('drops the photo immediately on mounted consumers when cache is cleared', async () => {
    const firstBlob = new Blob(['first'], { type: 'image/png' });
    vi.mocked(userService.getPhoto)
      .mockResolvedValueOnce(firstBlob)
      .mockReturnValueOnce(new Promise(() => {}));

    const { result } = renderHook(() => useUserPhoto('user-1', true));
    await waitFor(() => expect(result.current).toBe(firstBlob));

    act(() => {
      clearUserPhotoCache();
    });

    expect(result.current).toBeNull();
    expect(userService.getPhoto).toHaveBeenCalledTimes(2);
  });
});
