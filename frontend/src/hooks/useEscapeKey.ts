import { useEffect } from 'react';

export function useEscapeKey(isOpen: boolean, onClose: () => void, disabled = false) {
  useEffect(() => {
    if (!isOpen || disabled) return undefined;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose, disabled]);
}
