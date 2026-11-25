import { useEffect, useState } from 'react';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { problemService } from '@/services/problem.service';
import { roomService } from '@/services/room.service';
import type { Problem } from '@/types/problem';
import type { RoomStudent } from '@/types/room';

export type PerformanceOptions = {
  students: RoomStudent[];
  problems: Problem[];
};

async function fetchOptions(roomId: string): Promise<PerformanceOptions> {
  const [students, problems] = await Promise.all([
    roomService.listStudents(roomId),
    problemService.list(roomId),
  ]);
  return { students, problems: [...problems].sort((a, b) => a.ordem - b.ordem) };
}

/** Students and problems of the room, used to switch student and filter by problem. */
export function usePerformanceOptions(roomId: string) {
  const [options, setOptions] = useState<PerformanceOptions | null>(null);
  const { run, error } = useAsyncAction(fetchOptions);

  useEffect(() => {
    run(roomId).then((result) => result.ok && setOptions(result.data));
  }, [run, roomId]);

  return { options, error };
}
