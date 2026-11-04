import { useState, useEffect, useCallback } from 'react';
import {
  memberRoomService,
  type ProblemHeading,
  type RoomHeading,
} from '@/services/memberRoom.service';
import { gradesService } from '@/services/grades.service';
import { feedbackService } from '@/services/feedback.service';
import type { ProblemGradesResponse } from '@/types/grades';
import type { ProblemFeedbacksResponse } from '@/types/feedback';

async function fetchGradesAndFeedbacks(roomId: string, problemId: string) {
  return Promise.all([
    gradesService.getProblemGrades(roomId, problemId),
    feedbackService.getProblemFeedbacks(roomId, problemId),
  ]);
}

export function useProblemGradesData(roomId: string, problemId: string, isProfessor: boolean) {
  const [room, setRoom] = useState<RoomHeading | null>(null);
  const [problem, setProblem] = useState<ProblemHeading | null>(null);
  const [grades, setGrades] = useState<ProblemGradesResponse | null>(null);
  const [feedbacks, setFeedbacks] = useState<ProblemFeedbacksResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!roomId || !problemId) return;
    try {
      const [gradesData, feedbacksData] = await fetchGradesAndFeedbacks(roomId, problemId);
      setGrades(gradesData);
      setFeedbacks(feedbacksData);
    } catch {
      // Retain existing state on background refetch failure
    }
  }, [roomId, problemId]);

  useEffect(() => {
    if (!roomId || !problemId) return;
    let active = true;

    Promise.all([
      memberRoomService.room(roomId, isProfessor),
      memberRoomService.problem(roomId, problemId, isProfessor),
      fetchGradesAndFeedbacks(roomId, problemId),
    ])
      .then(([roomData, problemData, [gradesData, feedbacksData]]) => {
        if (!active) return;
        setRoom(roomData);
        setProblem(problemData);
        setGrades(gradesData);
        setFeedbacks(feedbacksData);
        setIsLoading(false);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(
          (err as { message?: string })?.message ||
            'Não foi possível carregar o relatório de notas do problema.',
        );
        setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [roomId, problemId, isProfessor]);

  return { room, problem, grades, setGrades, feedbacks, setFeedbacks, isLoading, error, refetch };
}
