import { useEffect, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { AppHeader } from '@/components/layout/AppHeader';
import { PAGE_CONTAINER_CLASS } from '@/components/ui/cardStyles';
import { sessionService } from '@/services/session.service';
import type { Session } from '@/types/session';
import { DEFAULT_SESSION_REPORT_STUDENTS, type SessionReportStudent } from '@/types/sessionReport';
import { cn } from '@/utils/cn';
import { SessionReportTable } from './components/SessionReportTable';

type SessionReportParams = {
  roomId?: string;
  turmaId?: string;
  problemId?: string;
  problemaId?: string;
  sessionId?: string;
  sessaoId?: string;
};

export type SessionReportPageProps = {
  students?: SessionReportStudent[];
};

export function SessionReportPage({ students: initialStudents }: SessionReportPageProps = {}) {
  const params = useParams<SessionReportParams>();
  const roomId = params.roomId ?? params.turmaId ?? '';
  const problemId = params.problemId ?? params.problemaId ?? '';
  const sessionId = params.sessionId ?? params.sessaoId ?? '';

  const location = useLocation();
  const state = location.state as {
    sessionTitle?: string;
    sessionTitulo?: string;
  } | null;

  const [session, setSession] = useState<Session | null>(null);
  const sessionSubtitle = session?.titulo ?? state?.sessionTitle ?? state?.sessionTitulo ?? '';

  useEffect(() => {
    if (!roomId || !problemId || !sessionId) return undefined;
    let active = true;

    sessionService
      .getById(roomId, problemId, sessionId)
      .then((data) => {
        if (active) setSession(data);
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, [roomId, problemId, sessionId]);

  const backUrl = `/turmas/${roomId}/problemas/${problemId}/sessoes/${sessionId}`;
  const students = initialStudents ?? DEFAULT_SESSION_REPORT_STUDENTS;

  return (
    <div className="min-h-dvh bg-surface pb-12">
      <AppHeader
        backUrl={backUrl}
        title="Relatório da Sessão"
        subtitle={sessionSubtitle || undefined}
      />
      <main className={cn(PAGE_CONTAINER_CLASS, 'mt-6')}>
        <SessionReportTable students={students} />
      </main>
    </div>
  );
}

export default SessionReportPage;
