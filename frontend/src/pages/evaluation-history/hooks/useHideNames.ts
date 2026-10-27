import { useState } from 'react';

const STORAGE_KEY = 'pbl360:evaluation-history:hide-names';

// Storage can be unavailable (private mode, blocked site data), so it is best-effort only.
function readStoredValue(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

function storeValue(value: boolean) {
  try {
    window.localStorage.setItem(STORAGE_KEY, String(value));
  } catch {
    // Ignored: the toggle still works for the current visit.
  }
}

export function useHideNames() {
  const [hideNames, setHideNamesState] = useState(readStoredValue);

  const setHideNames = (value: boolean) => {
    setHideNamesState(value);
    storeValue(value);
  };

  return { hideNames, setHideNames };
}
