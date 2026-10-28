import { useEffect, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { AppHeader } from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { PAGE_CONTAINER_CLASS } from '@/components/ui/cardStyles';
import { sessionService } from '@/services/session.service';
import type { Session } from '@/types/session';
import type { SessionReportStudent } from '@/types/sessionReport';
import { cn } from '@/utils/cn';
import { SessionReportEmptyState } from './components/SessionReportEmptyState';
import { SessionReportTable } from './components/SessionReportTable';
import { useSessionReportExport } from './useSessionReportExport';
import { useSessionReportStudents } from './useSessionReportStudents';

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

type ReportExportActionsProps = {
  isExportingPDF: boolean;
  isExportingExcel: boolean;
  onExport: (formato: 'PDF' | 'XLSX') => void;
};

function ReportExportActions({
  isExportingPDF,
  isExportingExcel,
  onExport,
}: ReportExportActionsProps) {
  return (
    <div className="mt-6 flex flex-col gap-3">
      <Button variant="primary" isLoading={isExportingPDF} onClick={() => onExport('PDF')}>
        Exportar em PDF
      </Button>
      <Button variant="primary" isLoading={isExportingExcel} onClick={() => onExport('XLSX')}>
        Exportar em Excel
      </Button>
    </div>
  );
}

function useSessionHeading(
  roomId: string,
  problemId: string,
  sessionId: string,
  fallback?: string,
) {
  const [session, setSession] = useState<Session | null>(null);

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

  return session?.titulo ?? fallback ?? '';
}

export function SessionReportPage({ students: initialStudents }: SessionReportPageProps = {}) {
  const params = useParams<SessionReportParams>();
  const roomId = params.roomId ?? params.turmaId ?? '';
  const problemId = params.problemId ?? params.problemaId ?? '';
  const sessionId = params.sessionId ?? params.sessaoId ?? '';

  const location = useLocation();
  const state = location.state as { sessionTitle?: string; sessionTitulo?: string } | null;
  const sessionSubtitle = useSessionHeading(
    roomId,
    problemId,
    sessionId,
    state?.sessionTitle ?? state?.sessionTitulo,
  );

  const { isExportingPDF, isExportingExcel, handleDownload } = useSessionReportExport(sessionId);
  const { students, isLoading } = useSessionReportStudents(
    roomId,
    problemId,
    sessionId,
    initialStudents,
  );

  const backUrl = `/turmas/${roomId}/problemas/${problemId}/sessoes/${sessionId}`;

  return (
    <div className="min-h-dvh bg-surface pb-12">
      <AppHeader
        backUrl={backUrl}
        title="Relatório da Sessão"
        subtitle={sessionSubtitle || undefined}
      />
      <main className={cn(PAGE_CONTAINER_CLASS, 'mt-6')}>
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner className="size-8 text-brand-900" />
          </div>
        ) : students.length === 0 ? (
          <SessionReportEmptyState />
        ) : (
          <>
            <SessionReportTable students={students} />
            <ReportExportActions
              isExportingPDF={isExportingPDF}
              isExportingExcel={isExportingExcel}
              onExport={(formato) => void handleDownload(formato)}
            />
          </>
        )}
      </main>
    </div>
  );
}

export default SessionReportPage;
