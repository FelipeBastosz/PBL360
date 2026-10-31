import { useEffect, useState } from 'react';
import { evaluationService } from '@/services/evaluation.service';
import { gradesService } from '@/services/grades.service';
import { roomService } from '@/services/room.service';
import type { SessionReportStudent } from '@/types/sessionReport';

async function fetchFromGrades(
  roomId: string,
  problemId: string,
  sessionId: string,
): Promise<SessionReportStudent[] | null> {
  if (!roomId || !problemId) return null;
  try {
    const data = await gradesService.getProblemGrades(roomId, problemId);
    if (data?.alunos && data.alunos.length > 0) {
      return data.alunos.map((aluno) => {
        const sessionGrade = aluno.sessoes?.find((s) => s.sessaoId === sessionId);
        return {
          id: aluno.alunoId,
          nome: aluno.nome,
          matricula: aluno.matricula || '—',
          notaFinal: sessionGrade?.nota ?? null,
        };
      });
    }
  } catch {
    // fallback to room students
  }
  return null;
}

async function fetchFromRoomAndEvaluations(
  roomId: string,
  sessionId: string,
): Promise<SessionReportStudent[]> {
  try {
    const [roomStudents, evaluations] = await Promise.all([
      roomId ? roomService.listStudents(roomId).catch(() => []) : [],
      sessionId ? evaluationService.listBySession(sessionId).catch(() => []) : [],
    ]);

    const evalMap = new Map(evaluations.map((e) => [e.alunoId, e.notaSessao]));

    if (roomStudents.length > 0) {
      return roomStudents.map((st) => ({
        id: st.id,
        nome: st.nome,
        matricula: st.matricula || '—',
        notaFinal: evalMap.get(st.id) ?? null,
      }));
    }

    if (evaluations.length > 0) {
      return evaluations.map((ev) => ({
        id: ev.alunoId,
        nome: ev.nome,
        matricula: '—',
        notaFinal: ev.notaSessao ?? null,
      }));
    }
  } catch {
    // fallback
  }
  return [];
}

async function fetchSessionReportStudents(
  roomId: string,
  problemId: string,
  sessionId: string,
): Promise<SessionReportStudent[]> {
  const fromGrades = await fetchFromGrades(roomId, problemId, sessionId);
  if (fromGrades) return fromGrades;
  return fetchFromRoomAndEvaluations(roomId, sessionId);
}

export function useSessionReportStudents(
  roomId: string,
  problemId: string,
  sessionId: string,
  initialStudents?: SessionReportStudent[],
) {
  const [fetchedStudents, setFetchedStudents] = useState<SessionReportStudent[]>([]);
  const [isLoading, setIsLoading] = useState(!initialStudents);

  useEffect(() => {
    if (initialStudents || !sessionId) return;
    let active = true;

    fetchSessionReportStudents(roomId, problemId, sessionId)
      .then((data) => {
        if (active) {
          setFetchedStudents(data);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [roomId, problemId, sessionId, initialStudents]);

  return {
    students: initialStudents ?? fetchedStudents,
    isLoading: initialStudents ? false : isLoading,
  };
}
