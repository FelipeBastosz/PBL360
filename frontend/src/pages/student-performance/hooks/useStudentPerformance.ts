import { useCallback, useEffect, useRef, useState } from 'react';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { studentPerformanceService } from '@/services/studentPerformance.service';
import type { StudentPerformance } from '@/types/studentPerformance';

type PerformanceQuery = {
  roomId: string;
  studentId: string;
  problemId: string | null;
};

type LoadedPerformance = { key: string; data: StudentPerformance };

const queryKey = ({ roomId, studentId, problemId }: PerformanceQuery) =>
  `${roomId}|${studentId}|${problemId ?? ''}`;

export function useStudentPerformance(query: PerformanceQuery) {
  const { roomId, studentId, problemId } = query;
  const key = queryKey(query);
  const latestKey = useRef(key);
  const [loaded, setLoaded] = useState<LoadedPerformance | null>(null);
  const { run, error, isLoading } = useAsyncAction(studentPerformanceService.get);

  const load = useCallback(() => {
    latestKey.current = key;
    run(roomId, studentId, problemId).then((result) => {
      // A slower answer for a previous student or filter must not replace the current one.
      if (result.ok && latestKey.current === key) setLoaded({ key, data: result.data });
    });
  }, [run, roomId, studentId, problemId, key]);

  useEffect(load, [load]);

  // Data that belongs to another student or filter is never shown while the new one loads.
  const performance = loaded?.key === key ? loaded.data : null;
  return { performance, error: isLoading ? null : error, reload: load };
}
