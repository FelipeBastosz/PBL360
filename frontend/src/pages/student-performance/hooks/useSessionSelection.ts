import { useState } from 'react';
import type { StudentPerformanceSession } from '@/types/studentPerformance';

/**
 * Which session is in focus. It starts on the most recent one and falls back to it whenever
 * the selected session leaves the list (new student, new filter).
 */
export function useSessionSelection(sessions: StudentPerformanceSession[]) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const found = sessions.findIndex((session) => session.sessaoId === selectedId);
  const index = found >= 0 ? found : sessions.length - 1;

  const select = (next: number) => {
    const session = sessions[next];
    if (session) setSelectedId(session.sessaoId);
  };

  return {
    index,
    select,
    previous: () => select(index - 1),
    next: () => select(index + 1),
  };
}
