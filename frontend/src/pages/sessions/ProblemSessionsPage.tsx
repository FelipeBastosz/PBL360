import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { FabMenu } from '@/components/ui/FabMenu';
import { SearchField } from '@/components/ui/SearchField';
import { CARD_GRID_CLASS, PAGE_CONTAINER_CLASS } from '@/components/ui/cardStyles';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/routes/paths';
import type { GeneralFeedbackResponse } from '@/types/feedback';
import type { Session } from '@/types/session';
import { cn } from '@/utils/cn';
import { SessionsEmptyState } from './components/SessionsEmptyState';
import { SessionFormModal } from './components/SessionFormModal';
import { SessionCard } from './components/SessionCard';
import { ProblemSessionsHeader } from './components/ProblemSessionsHeader';
import { ProblemGeneralFeedbackModal } from './components/ProblemGeneralFeedbackModal';
import { useProblemGeneralFeedback } from './hooks/useProblemGeneralFeedback';
import { useProblemSessions } from './hooks/useProblemSessions';
import { ProblemTopActions } from './ProblemTopActions';

function SessionsSearch({ query, setQuery }: { query: string; setQuery: (v: string) => void }) {
  return (
    <SearchField label="Pesquisar sessão" value={query} onChange={setQuery} className="mt-2" />
  );
}

type SessionsFabMenuProps = {
  isProfessor: boolean;
  roomId: string;
  problemId: string;
  onOpenCreate: () => void;
};

function SessionsFabMenu({ isProfessor, roomId, problemId, onOpenCreate }: SessionsFabMenuProps) {
  if (!isProfessor) return null;

  const manageSessionsPath = ROUTES.manageSessions
    .replace(':roomId', roomId)
    .replace(':problemId', problemId);

  return (
    <FabMenu
      label="Ações da sessão"
      actions={[
        { label: 'Editar uma sessão', to: manageSessionsPath },
        { label: 'Criar nova sessão', onClick: onOpenCreate },
      ]}
    />
  );
}

type MainProps = {
  error: { message: string } | null;
  isProfessor: boolean;
  query: string;
  setQuery: (v: string) => void;
  isLoading: boolean;
  sessions: Session[];
  roomId: string;
  problemId: string;
  generalFeedback: GeneralFeedbackResponse | null;
  isGeneralFeedbackLoading: boolean;
  onOpenGeneralFeedback: () => void;
};

function ProblemSessionsMain({
  error,
  isProfessor,
  query,
  setQuery,
  isLoading,
  sessions,
  roomId,
  problemId,
  generalFeedback,
  isGeneralFeedbackLoading,
  onOpenGeneralFeedback,
}: MainProps) {
  return (
    <main className={cn(PAGE_CONTAINER_CLASS, 'mt-6 flex flex-col gap-4')}>
      {error && <Alert tone="error">{error.message}</Alert>}
      <ProblemTopActions
        isProfessor={isProfessor}
        roomId={roomId}
        problemId={problemId}
        generalFeedback={generalFeedback}
        isGeneralFeedbackLoading={isGeneralFeedbackLoading}
        onOpenGeneralFeedback={onOpenGeneralFeedback}
      />
      <SessionsSearch query={query} setQuery={setQuery} />
      {isLoading ? (
        <div className="mt-10 flex justify-center">
          <Spinner className="size-8 text-brand-accent" />
        </div>
      ) : sessions.length === 0 ? (
        query ? (
          <p className="mt-10 text-center text-sm text-muted">Nenhuma sessão encontrada.</p>
        ) : (
          <SessionsEmptyState isProfessor={isProfessor} />
        )
      ) : (
        <div className={cn(CARD_GRID_CLASS, 'mt-2')}>
          {sessions.map((session) => (
            <SessionCard key={session.id} session={session} roomId={roomId} problemId={problemId} />
          ))}
        </div>
      )}
    </main>
  );
}

type ModalsProps = {
  isProfessor: boolean;
  roomId: string;
  problemId: string;
  isCreateModalOpen: boolean;
  onCloseCreate: () => void;
  onSessionCreated: (session: Session) => void;
  isGeneralFeedbackOpen: boolean;
  onCloseGeneralFeedback: () => void;
  generalFeedback: ReturnType<typeof useProblemGeneralFeedback>;
};

function ProblemSessionsModals({
  isProfessor,
  roomId,
  problemId,
  isCreateModalOpen,
  onCloseCreate,
  onSessionCreated,
  isGeneralFeedbackOpen,
  onCloseGeneralFeedback,
  generalFeedback,
}: ModalsProps) {
  return (
    <>
      <SessionFormModal
        isOpen={isCreateModalOpen}
        roomId={roomId}
        problemId={problemId}
        initialData={null}
        onClose={onCloseCreate}
        onSuccess={onSessionCreated}
      />
      {isProfessor && (
        <ProblemGeneralFeedbackModal
          isOpen={isGeneralFeedbackOpen}
          onClose={onCloseGeneralFeedback}
          existingFeedback={generalFeedback.feedback}
          isLoading={generalFeedback.isLoading}
          loadError={generalFeedback.error}
          onRetryLoad={generalFeedback.reload}
          roomId={roomId}
          problemId={problemId}
          onSaved={generalFeedback.setFeedback}
        />
      )}
    </>
  );
}

function useProblemSessionsView() {
  const {
    roomId,
    id,
    problemId = '',
  } = useParams<{
    roomId?: string;
    id?: string;
    problemId: string;
  }>();
  const currentRoomId = roomId || id || '';
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const isProfessor = user?.tipo === 'PROFESSOR';
  const closeCreate = () => setIsCreateOpen(false);
  const sessionsState = useProblemSessions(isProfessor, currentRoomId, problemId, closeCreate);
  const generalFeedback = useProblemGeneralFeedback(currentRoomId, problemId, isProfessor);
  const filtered = sessionsState.sessions.filter((s) =>
    s.titulo.toLowerCase().includes(query.toLowerCase()),
  );

  return {
    roomId: currentRoomId,
    problemId,
    user,
    query,
    setQuery,
    isCreateOpen,
    setIsCreateOpen,
    closeCreate,
    isFeedbackOpen,
    setIsFeedbackOpen,
    isProfessor,
    sessionsState,
    generalFeedback,
    filtered,
  };
}

export default function ProblemSessionsPage() {
  const v = useProblemSessionsView();

  return (
    <div className="min-h-dvh bg-surface pb-24">
      <ProblemSessionsHeader
        room={v.sessionsState.room}
        problem={v.sessionsState.problem}
        userNome={v.user?.nome}
        user={v.user}
      />
      <ProblemSessionsMain
        error={v.sessionsState.error}
        isProfessor={v.isProfessor}
        query={v.query}
        setQuery={v.setQuery}
        isLoading={v.sessionsState.isLoading}
        sessions={v.filtered}
        roomId={v.roomId}
        problemId={v.problemId}
        generalFeedback={v.generalFeedback.feedback}
        isGeneralFeedbackLoading={v.generalFeedback.isLoading}
        onOpenGeneralFeedback={() => v.setIsFeedbackOpen(true)}
      />
      <SessionsFabMenu
        isProfessor={v.isProfessor}
        roomId={v.roomId}
        problemId={v.problemId}
        onOpenCreate={() => v.setIsCreateOpen(true)}
      />
      <ProblemSessionsModals
        isProfessor={v.isProfessor}
        roomId={v.roomId}
        problemId={v.problemId}
        isCreateModalOpen={v.isCreateOpen}
        onCloseCreate={v.closeCreate}
        onSessionCreated={v.sessionsState.handleSessionCreated}
        isGeneralFeedbackOpen={v.isFeedbackOpen}
        onCloseGeneralFeedback={() => v.setIsFeedbackOpen(false)}
        generalFeedback={v.generalFeedback}
      />
    </div>
  );
}
