import { useSyncExternalStore } from 'react';

const QUERY = '(min-width: 1024px)';

function subscribe(onChange: () => void) {
  if (typeof window.matchMedia !== 'function') return () => undefined;
  const media = window.matchMedia(QUERY);
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
}

function snapshot() {
  return typeof window.matchMedia === 'function' && window.matchMedia(QUERY).matches;
}

export function useWideLayout(): boolean {
  return useSyncExternalStore(subscribe, snapshot, () => false);
}
