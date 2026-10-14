import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { problemService } from '@/services/problem.service';
import { sessionService } from '@/services/session.service';
import type { Problem } from '@/types/problem';
import type { Session, SessionDeletionImpact } from '@/types/session';
import { DeleteSessionModal } from './components/DeleteSessionModal';
import { SessionFormModal } from './components/SessionFormModal';
import { ManageSessionsHeader } from './components/ManageSessionsHeader';
import { ManageSessionCard } from './components/ManageSessionCard';

function ManageFooter({ onFinish }: { onFinish: () => void }) {
  return (
    <footer className="fixed bottom-0 left-0 right-0 border-t border-black/5 bg-surface/95 px-6 py-4 backdrop-blur-xs">
      <div className="mx-auto flex max-w-md flex-col gap-2">
        <Button onClick={onFinish}>Concluir edição</Button>
        <Button variant="link" onClick={onFinish}>
          Cancelar
        </Button>
      </div>
    </footer>
  );
}

type ContentProps = {
  isLoading: boolean;
  sessions: Session[];
  onEdit: (s: Session) => void;
  onDelete: (s: Session) => void;
};

function ManageSessionsContent({ isLoading, sessions, onEdit, onDelete }: ContentProps) {
  if (isLoading) {
    return (
      <div className="mt-10 flex justify-center">
        <Spinner className="size-8 text-brand-900" />
      </div>
    );
  }
  return (
    <main className="mx-auto mt-6 flex w-full max-w-md flex-col gap-3 px-4">
      {sessions.map((s) => (
        <ManageSessionCard key={s.id} session={s} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </main>
  );
}

type DeleteParams = {
  roomId: string | undefined;
  problemId: string | undefined;
  s: Session;
  setSessionToDelete: (s: Session | null) => void;
  setImpact: (i: SessionDeletionImpact | null) => void;
};

type ConfirmParams = {
  roomId: string | undefined;
  problemId: string | undefined;
  sessionToDelete: Session | null;
  deleteSession: (
    ...args: [string, string, string]
  ) => Promise<{ ok: true; data: void } | { ok: false; error: unknown }>;
  setSessions: React.Dispatch<React.SetStateAction<Session[]>>;
  setSessionToDelete: (s: Session | null) => void;
  notify: (toast: { tone: 'success' | 'error' | 'info'; message: string }) => void;
};

async function executeOpenDelete({
  roomId,
  problemId,
  s,
  setSessionToDelete,
  setImpact,
}: DeleteParams) {
  setSessionToDelete(s);
  if (!roomId || !problemId) return;
  const data = await sessionService.getDeletionImpact(roomId, problemId, s.id).catch(() => ({
    podeExcluir: true,
    chamada: 0,
    papeis: 0,
    observacoes: 0,
    avaliacoes: 0,
    feedbacks: 0,
  }));
  setImpact(data);
}

async function executeConfirmDelete({
  roomId,
  problemId,
  sessionToDelete,
  deleteSession,
  setSessions,
  setSessionToDelete,
  notify,
}: ConfirmParams) {
  if (!roomId || !problemId || !sessionToDelete) return;
  const res = await deleteSession(roomId, problemId, sessionToDelete.id);
  if (res.ok) {
    setSessions((curr) => curr.filter((item) => item.id !== sessionToDelete.id));
    setSessionToDelete(null);
    notify({ tone: 'success', message: 'Sessão excluída com sucesso!' });
  }
}

function useManageSessions(roomId?: string, problemId?: string) {
  const { notify } = useToast();
  const [problem, setProblem] = useState<Problem | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionToEdit, setSessionToEdit] = useState<Session | null>(null);
  const [sessionToDelete, setSessionToDelete] = useState<Session | null>(null);
  const [impact, setImpact] = useState<SessionDeletionImpact | null>(null);

  const { run: fetchProblem } = useAsyncAction(problemService.getById);
  const { run: fetchSessions, isLoading } = useAsyncAction(sessionService.list);
  const { run: deleteSession, isLoading: isDeleting } = useAsyncAction(sessionService.remove);

  useEffect(() => {
    if (roomId && problemId) {
      fetchProblem(roomId, problemId).then((r) => r.ok && setProblem(r.data));
      fetchSessions(roomId, problemId).then((r) => r.ok && setSessions(r.data as Session[]));
    }
  }, [roomId, problemId, fetchProblem, fetchSessions]);

  return {
    problem,
    sessions,
    setSessions,
    isLoading,
    isDeleting,
    sessionToEdit,
    setSessionToEdit,
    sessionToDelete,
    setSessionToDelete,
    impact,
    notify,
    handleOpenDelete: (s: Session) =>
      executeOpenDelete({ roomId, problemId, s, setSessionToDelete, setImpact }),
    handleConfirmDelete: () =>
      executeConfirmDelete({
        roomId,
        problemId,
        sessionToDelete,
        deleteSession,
        setSessions,
        setSessionToDelete,
        notify,
      }),
  };
}

export default function ManageSessionsPage() {
  const params = useParams<{ roomId?: string; id?: string; problemId: string }>();
  const currentRoomId = params.roomId || params.id || '';
  const problemId = params.problemId || '';

  const navigate = useNavigate();
  const { user } = useAuth();
  const state = useManageSessions(currentRoomId, problemId);
  const backUrl = `/turmas/${currentRoomId}/problemas/${problemId}`;

  return (
    <div className="min-h-dvh bg-surface pb-36">
      <ManageSessionsHeader
        problem={state.problem}
        userNome={user?.nome}
        user={user}
        backUrl={backUrl}
      />
      <ManageSessionsContent
        isLoading={state.isLoading}
        sessions={state.sessions}
        onEdit={state.setSessionToEdit}
        onDelete={state.handleOpenDelete}
      />
      <ManageFooter onFinish={() => navigate(backUrl)} />
      <DeleteSessionModal
        sessionTitle={state.sessionToDelete?.titulo ?? ''}
        impact={state.impact}
        isOpen={Boolean(state.sessionToDelete)}
        isLoading={state.isDeleting}
        onConfirm={state.handleConfirmDelete}
        onCancel={() => state.setSessionToDelete(null)}
      />
      <SessionFormModal
        isOpen={Boolean(state.sessionToEdit)}
        roomId={currentRoomId}
        problemId={problemId}
        initialData={state.sessionToEdit}
        onClose={() => state.setSessionToEdit(null)}
        onSuccess={(updated) => {
          state.setSessions((curr) => curr.map((s) => (s.id === updated.id ? updated : s)));
          state.setSessionToEdit(null);
          state.notify({ tone: 'success', message: 'Sessão atualizada com sucesso!' });
        }}
      />
    </div>
  );
}
