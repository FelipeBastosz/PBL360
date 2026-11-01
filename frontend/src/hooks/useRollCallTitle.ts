import { useEffect, useState } from 'react';
import { problemService } from '@/services/problem.service';
import { sessionService } from '@/services/session.service';
import { formatDayMonth } from '@/utils/date';

export type RollCallTitle = { title: string; subtitle: string };

type TitleSource = {
  roomId?: string;
  problemId?: string;
  sessionId: string;
  fallback: RollCallTitle;
};

export function useRollCallTitle({ roomId, problemId, sessionId, fallback }: TitleSource) {
  const [title, setTitle] = useState<RollCallTitle | null>(null);

  useEffect(() => {
    if (!roomId || !problemId) return undefined;
    let active = true;
    Promise.all([
      problemService.getById(roomId, problemId),
      sessionService.getById(roomId, problemId, sessionId),
    ])
      .then(([problem, session]) => {
        if (!active) return;
        setTitle({
          title: `Chamada - ${problem.titulo}`,
          subtitle: `${session.titulo} · ${formatDayMonth(session.data)}`,
        });
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [roomId, problemId, sessionId]);

  return title ?? fallback;
}
