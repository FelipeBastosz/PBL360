import { useCallback, useEffect, useState } from 'react';
import { useToast } from '@/hooks/useToast';
import { toApiError } from '@/services/apiError';
import {
  memberRoomService,
  type ProblemHeading,
  type RoomHeading,
} from '@/services/memberRoom.service';
import { sessionService } from '@/services/session.service';
import type { ProblemTableReport, Session } from '@/types/session';
import { parseApiDate } from '@/utils/date';
import { triggerBlobDownload } from '@/utils/download';

export type SessionTableReportsGroup = {
  session: Session;
  reports: ProblemTableReport[];
};

const dateSortKey = (value: string): number | null => {
  const parts = parseApiDate(value);
  if (!parts) return null;
  return parts.year * 10000 + parts.month * 100 + parts.day;
};

const compareSessions = (a: Session, b: Session): number => {
  const dateA = dateSortKey(a.data);
  const dateB = dateSortKey(b.data);
  if (dateA !== null && dateB !== null && dateA !== dateB) return dateA - dateB;
  return a.ordem - b.ordem;
};

function groupReportsBySession(
  sessions: Session[],
  reports: ProblemTableReport[],
): SessionTableReportsGroup[] {
  const reportsBySession = new Map<string, ProblemTableReport[]>();
  for (const report of reports) {
    const list = reportsBySession.get(report.sessaoId) ?? [];
    list.push(report);
    reportsBySession.set(report.sessaoId, list);
  }
  return [...sessions].sort(compareSessions).map((session) => ({
    session,
    reports: reportsBySession.get(session.id) ?? [],
  }));
}

async function loadProblemData(roomId: string, problemId: string, isProfessor: boolean) {
  const [room, problem, sessions, reports] = await Promise.all([
    memberRoomService.room(roomId, isProfessor),
    memberRoomService.problem(roomId, problemId, isProfessor),
    memberRoomService.sessions(roomId, problemId, isProfessor),
    sessionService.listProblemTableReports(roomId, problemId),
  ]);
  return { room, problem, groups: groupReportsBySession(sessions, reports) };
}

type TableReportsState = {
  key: string;
  room: RoomHeading | null;
  problem: ProblemHeading | null;
  groups: SessionTableReportsGroup[];
  error: string | null;
};

const INITIAL_STATE: TableReportsState = {
  key: '',
  room: null,
  problem: null,
  groups: [],
  error: null,
};

export function useProblemTableReports(roomId: string, problemId: string, isProfessor: boolean) {
  const { notify } = useToast();
  const requestKey = `${roomId}:${problemId}:${isProfessor}`;
  const [state, setState] = useState<TableReportsState>(INITIAL_STATE);

  useEffect(() => {
    if (!roomId || !problemId) return;
    let active = true;
    loadProblemData(roomId, problemId, isProfessor)
      .then((data) => {
        if (active) setState({ key: requestKey, ...data, error: null });
      })
      .catch((caught) => {
        if (active)
          setState({ ...INITIAL_STATE, key: requestKey, error: toApiError(caught).message });
      });
    return () => {
      active = false;
    };
  }, [roomId, problemId, isProfessor, requestKey]);

  const downloadReport = useCallback(
    async (report: ProblemTableReport) => {
      try {
        const blob = await sessionService.downloadAttachment(report.sessaoId, report.id);
        triggerBlobDownload(blob, report.nomeArquivo);
      } catch {
        notify({ tone: 'error', message: 'Não foi possível baixar o relatório de mesa.' });
      }
    },
    [notify],
  );

  const isLoading = Boolean(roomId && problemId) && state.key !== requestKey;

  return {
    room: state.room,
    problem: state.problem,
    groups: state.groups,
    isLoading,
    error: state.error,
    downloadReport,
  };
}
