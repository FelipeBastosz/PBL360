import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export function useLeaveGuard(hasUnsavedChanges: boolean, fallbackPath: string) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAsking, setIsAsking] = useState(false);

  useEffect(() => {
    if (!hasUnsavedChanges) return undefined;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [hasUnsavedChanges]);

  const leave = useCallback(() => {
    if (location.key === 'default') navigate(fallbackPath);
    else navigate(-1);
  }, [fallbackPath, location.key, navigate]);

  return {
    isAsking,
    requestLeave: () => (hasUnsavedChanges ? setIsAsking(true) : leave()),
    confirmLeave: () => {
      setIsAsking(false);
      leave();
    },
    stay: () => setIsAsking(false),
  };
}
