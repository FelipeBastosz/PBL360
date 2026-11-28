import { useCallback, useEffect, useState } from 'react';
import { useToast } from '@/hooks/useToast';
import { toApiError } from '@/services/apiError';
import {
  memberRoomService,
  type ProblemHeading,
  type RoomHeading,
} from '@/services/memberRoom.service';
import { sessionService } from '@/services/session.service';
import type { Session, SessionAttachment } from '@/types/session';
import { triggerBlobDownload } from '@/utils/download';

export type SessionTableReportsGroup = {
  session: Session;
  reports: SessionAttachment[];
  hasError: boolean;
};

const isTableReport = (attachment: SessionAttachment) => attachment.categoria === 'RELATORIO_MESA';

const sortBySessionOrder = (sessions: Session[]) => [...sessions].sort((a, b) => a.ordem - b.ordem);

async function fetchSessionReports(session: Session): Promise<SessionTableReportsGroup> {
  try {
    const attachments = await sessionService.listAttachments(session.id);
    return { session, reports: attachments.filter(isTableReport), hasError: false };
  } catch {
    return { session, reports: [], hasError: true };
  }
}

async function loadProblemData(roomId: string, problemId: string, isProfessor: boolean) {
  const [room, problem, sessions] = await Promise.all([
    memberRoomService.room(roomId, isProfessor),
    memberRoomService.problem(roomId, problemId, isProfessor),
    memberRoomService.sessions(roomId, problemId, isProfessor),
  ]);
  const ordered = sortBySessionOrder(sessions);
  const groups = await Promise.all(ordered.map(fetchSessionReports));
  return { room, problem, groups };
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
    async (sessionId: string, attachment: SessionAttachment) => {
      try {
        const blob = await sessionService.downloadAttachment(sessionId, attachment.id);
        triggerBlobDownload(blob, attachment.nomeArquivo);
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
