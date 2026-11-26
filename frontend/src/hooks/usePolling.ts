import { useEffect, useRef } from 'react';

// Runs `callback` every `intervalMs` while enabled, skipping ticks while the tab is hidden.
// The latest callback is always the one called, so the interval does not restart on renders.
export function usePolling(callback: () => void, intervalMs: number, enabled = true) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) return undefined;
    const id = window.setInterval(() => {
      if (!document.hidden) savedCallback.current();
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs, enabled]);
}
