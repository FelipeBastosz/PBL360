import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { problemService } from '@/services/problem.service';
import { memberRoomService } from '@/services/memberRoom.service';
import { sessionService } from '@/services/session.service';
import type { Problem } from '@/types/problem';
import type { Session, SessionReleasesResponse } from '@/types/session';

function buildPayload(type: 'autoavaliacao' | 'pares', liberada: boolean, prazo: string | null) {
  const other = type === 'autoavaliacao' ? 'pares' : 'autoavaliacao';
  return {
    [type]: { liberada, prazo },
    ...(liberada ? { [other]: { liberada: false, prazo: null } } : {}),
  };
}

function getOtherActiveType(
  modalType: 'autoavaliacao' | 'pares' | null,
  releases: SessionReleasesResponse | null,
): 'autoavaliacao' | 'pares' | null {
  if (modalType === 'autoavaliacao') return releases?.pares.liberada ? 'pares' : null;
  if (modalType === 'pares') return releases?.autoavaliacao.liberada ? 'autoavaliacao' : null;
  return null;
}

function useSessionData(
  roomId?: string,
  problemId?: string,
  sessionId?: string,
  isProfessor = false,
) {
  const [session, setSession] = useState<Session | null>(null);
  const [problem, setProblem] = useState<Pick<Problem, 'titulo'> | null>(null);
  const [releases, setReleases] = useState<SessionReleasesResponse | null>(null);
  const [isAttendancePending, setIsAttendancePending] = useState(false);

  const { run: fetchProblem } = useAsyncAction(problemService.getById);
  const { run: fetchSession, isLoading, error } = useAsyncAction(sessionService.getById);
  const {
    run: fetchStudentSession,
    isLoading: isLoadingStudent,
    error: studentError,
  } = useAsyncAction(memberRoomService.studentSession);

  useEffect(() => {
    if (!roomId || !problemId || !sessionId) return;
    if (!isProfessor) {
      fetchStudentSession(sessionId).then(
        (r) => r.ok && (setSession(r.data), setProblem({ titulo: r.data.problemaTitulo })),
      );
      return;
    }
    fetchProblem(roomId, problemId).then((r) => r.ok && setProblem(r.data));
    fetchSession(roomId, problemId, sessionId).then((r) => r.ok && setSession(r.data));
    sessionService
      .getReleases(sessionId)
      ?.then(setReleases)
      ?.catch((e: { status?: number }) => e?.status === 409 && setIsAttendancePending(true));
  }, [isProfessor, roomId, problemId, sessionId, fetchProblem, fetchSession, fetchStudentSession]);

  return {
    session,
    problem,
    releases,
    setReleases,
    isAttendancePending,
    isLoading: isLoading || isLoadingStudent,
    error: error ?? studentError,
  };
}

function useUpdateRelease(
  sessionId: string | undefined,
  setReleases: (releases: SessionReleasesResponse) => void,
) {
  const { notify } = useToast();
  const {
    run: updateReleases,
    isLoading: isUpdating,
    error: releaseError,
  } = useAsyncAction(sessionService.updateReleases);

  const executeReleaseChange = async (
    type: 'autoavaliacao' | 'pares',
    liberada: boolean,
    prazo: string | null,
  ) => {
    if (!sessionId) return false;
    const res = await updateReleases(sessionId, buildPayload(type, liberada, prazo));
    if (!res.ok) return false;
    setReleases(res.data);
    notify({
      tone: 'success',
      message: liberada ? 'Avaliação liberada com sucesso!' : 'Avaliação bloqueada com sucesso!',
    });
    return true;
  };

  return { executeReleaseChange, isUpdating, releaseError };
}

function useReleaseModals(
  releases: SessionReleasesResponse | null,
  executeChange: (
    type: 'autoavaliacao' | 'pares',
    liberada: boolean,
    prazo: string | null,
  ) => Promise<boolean>,
) {
  const [modalType, setModalType] = useState<'autoavaliacao' | 'pares' | null>(null);
  const [typeToLock, setTypeToLock] = useState<'autoavaliacao' | 'pares' | null>(null);

  const handleToggleClick = (type: 'autoavaliacao' | 'pares') => {
    const current = releases?.[type];
    if (!current?.liberada) {
      setModalType(type);
    } else if (current.enviadas > 0) {
      setTypeToLock(type);
    } else {
      executeChange(type, false, null);
    }
  };

  const confirmRelease = async (prazo: string | null) => {
    if (modalType && (await executeChange(modalType, true, prazo))) setModalType(null);
  };

  const confirmLock = async () => {
    if (typeToLock && (await executeChange(typeToLock, false, null))) setTypeToLock(null);
  };

  return {
    modalType,
    typeToLock,
    activeOtherType: getOtherActiveType(modalType, releases),
    handleToggleClick,
    confirmRelease,
    closeReleaseModal: () => setModalType(null),
    confirmLock,
    closeLockModal: () => setTypeToLock(null),
  };
}

export function useSessionHub() {
  const { roomId, problemId, sessionId } = useParams<{
    roomId: string;
    problemId: string;
    sessionId: string;
  }>();
  const { user } = useAuth();
  const isProfessor = user?.tipo === 'PROFESSOR';

  const data = useSessionData(roomId, problemId, sessionId, isProfessor);
  const { executeReleaseChange, isUpdating, releaseError } = useUpdateRelease(
    sessionId,
    data.setReleases,
  );
  const modals = useReleaseModals(data.releases, executeReleaseChange);

  return {
    ...data,
    ...modals,
    user,
    isProfessor,
    isUpdating,
    releaseError,
    sessionId: sessionId ?? '',
    combinedError: data.error ?? releaseError,
    basePath: `/turmas/${roomId}/problemas/${problemId}/sessoes/${sessionId}`,
    backUrl: `/turmas/${roomId}/problemas/${problemId}`,
  };
}
