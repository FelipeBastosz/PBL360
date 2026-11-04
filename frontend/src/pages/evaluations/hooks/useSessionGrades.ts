import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePokerChannel } from '@/hooks/usePokerChannel';
import { gradesService } from '@/services/grades.service';
import type { StudentSessionGrade } from '@/types/grades';

export type SessionGrades = Map<string, StudentSessionGrade>;

async function fetchSessionGrades(
  roomId: string,
  problemId: string,
  sessionId: string,
): Promise<SessionGrades> {
  const data = await gradesService.getProblemGrades(roomId, problemId);
  return new Map(
    data.alunos.flatMap((aluno) => {
      const session = aluno.sessoes.find((item) => item.sessaoId === sessionId);
      return session ? [[aluno.alunoId, session] as const] : [];
    }),
  );
}

export function useSessionGrades(roomId?: string, problemId?: string, sessionId?: string) {
  const [grades, setGrades] = useState<SessionGrades>(() => new Map());
  const [version, setVersion] = useState(0);
  const reload = useCallback(() => setVersion((current) => current + 1), []);

  useEffect(() => {
    if (!roomId || !problemId || !sessionId) return undefined;
    let active = true;
    fetchSessionGrades(roomId, problemId, sessionId)
      .then((data) => {
        if (active) setGrades(data);
      })
      .catch(() => {
        if (active) setGrades(new Map());
      });
    return () => {
      active = false;
    };
  }, [roomId, problemId, sessionId, version]);

  const usesPoker = useMemo(
    () => [...grades.values()].some((grade) => grade.pares?.origem === 'PLANNING_POKER'),
    [grades],
  );

  usePokerChannel(sessionId ?? '', usesPoker, {
    onEvent: (name) => {
      if (name === 'poker.decidida') reload();
    },
    onResync: reload,
  });

  return grades;
}
