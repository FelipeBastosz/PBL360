import { useEffect, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { AppHeader } from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { PAGE_CONTAINER_CLASS } from '@/components/ui/cardStyles';
import { sessionService } from '@/services/session.service';
import type { Session } from '@/types/session';
import type { ExportSessionReportOptions, SessionReportStudent } from '@/types/sessionReport';
import { cn } from '@/utils/cn';
import { ExportConfigModal } from './components/ExportConfigModal';
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

function ReportExportActions({ onExport }: { onExport: (formato: 'PDF' | 'XLSX') => void }) {
  return (
    <div className="mt-6 flex flex-col gap-3">
      <Button variant="primary" onClick={() => onExport('PDF')}>
        Exportar em PDF
      </Button>
      <Button variant="primary" onClick={() => onExport('XLSX')}>
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

function useSessionReportRouteData() {
  const params = useParams<SessionReportParams>();
  const roomId = params.roomId ?? params.turmaId ?? '';
  const problemId = params.problemId ?? params.problemaId ?? '';
  const sessionId = params.sessionId ?? params.sessaoId ?? '';
  const location = useLocation();
  const state = location.state as { sessionTitle?: string; sessionTitulo?: string } | null;
  const subtitle = useSessionHeading(
    roomId,
    problemId,
    sessionId,
    state?.sessionTitle ?? state?.sessionTitulo,
  );
  return { roomId, problemId, sessionId, subtitle };
}

function SessionReportContent({
  isLoading,
  students,
  onExport,
}: {
  isLoading: boolean;
  students: SessionReportStudent[];
  onExport: (format: 'PDF' | 'XLSX') => void;
}) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner className="size-8 text-brand-900" />
      </div>
    );
  }
  if (students.length === 0) return <SessionReportEmptyState />;
  return (
    <>
      <SessionReportTable students={students} />
      <ReportExportActions onExport={onExport} />
    </>
  );
}

export function SessionReportPage({ students: initialStudents }: SessionReportPageProps = {}) {
  const { roomId, problemId, sessionId, subtitle } = useSessionReportRouteData();
  const exportCtrl = useSessionReportExport(sessionId, subtitle);
  const { students, isLoading } = useSessionReportStudents(
    roomId,
    problemId,
    sessionId,
    initialStudents,
  );
  const [format, setFormat] = useState<'PDF' | 'XLSX' | null>(null);

  const onConfirm = async (options: ExportSessionReportOptions) => {
    if (format && (await exportCtrl.handleDownload(format, options))) setFormat(null);
  };

  return (
    <div className="min-h-dvh bg-surface pb-12">
      <AppHeader
        backUrl={`/turmas/${roomId}/problemas/${problemId}/sessoes/${sessionId}`}
        title="Relatório da Sessão"
        subtitle={subtitle || undefined}
      />
      <main className={cn(PAGE_CONTAINER_CLASS, 'mt-6')}>
        <SessionReportContent isLoading={isLoading} students={students} onExport={setFormat} />
        <ExportConfigModal
          isOpen={format !== null}
          format={format}
          isLoading={exportCtrl.isExportingPDF || exportCtrl.isExportingExcel}
          onClose={() => setFormat(null)}
          onConfirm={onConfirm}
        />
      </main>
    </div>
  );
}

export default SessionReportPage;
