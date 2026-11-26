import { useCallback, useEffect, useState } from 'react';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { feedbackService } from '@/services/feedback.service';
import { memberRoomService } from '@/services/memberRoom.service';
import { problemService } from '@/services/problem.service';
import type { Problem } from '@/types/problem';
import {
  type MyPerformanceSession,
  sortChronologically,
  toMyPerformanceSessions,
} from '@/utils/myPerformance';

export type MyPerformance = {
  roomName: string;
  problems: Problem[];
  sessions: MyPerformanceSession[];
};

async function fetchMyPerformance(roomId: string): Promise<MyPerformance> {
  const [room, problems] = await Promise.all([
    memberRoomService.room(roomId, false),
    problemService.list(roomId),
  ]);
  const ordered = [...problems].sort((a, b) => a.ordem - b.ordem);
  // Students have no room-wide grades endpoint, so each problem is read on its own.
  const responses = await Promise.all(
    ordered.map((problem) => feedbackService.getMyProblemFeedbacks(roomId, problem.id)),
  );
  const groups = ordered.map((problem, index) =>
    toMyPerformanceSessions({ problem, response: responses[index] }),
  );
  return { roomName: room.nome, problems: ordered, sessions: sortChronologically(groups) };
}

export function useMyPerformance(roomId: string) {
  const [performance, setPerformance] = useState<MyPerformance | null>(null);
  const { run, error, isLoading } = useAsyncAction(fetchMyPerformance);

  const load = useCallback(() => {
    run(roomId).then((result) => result.ok && setPerformance(result.data));
  }, [run, roomId]);

  useEffect(load, [load]);

  return { performance, error: isLoading ? null : error, reload: load };
}
