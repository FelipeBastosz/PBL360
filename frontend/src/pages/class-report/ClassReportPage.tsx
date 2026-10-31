import { useParams } from 'react-router-dom';
import { Spinner } from '@/components/ui/Spinner';
import { PAGE_CONTAINER_CLASS } from '@/components/ui/cardStyles';
import { cn } from '@/utils/cn';
import { useClassReport } from './hooks/useClassReport';
import { useClassReportExport } from './hooks/useClassReportExport';
import { ClassReportHeader } from './components/ClassReportHeader';
import { ClassReportTable } from './components/ClassReportTable';
import { ClassReportExportActions } from './components/ClassReportExportActions';
import { ClassReportEmptyState } from './components/ClassReportEmptyState';
import { ClassReportErrorState } from './components/ClassReportErrorState';

export function ClassReportPage() {
  const { id: roomId } = useParams<{ id: string }>();
  const { data, isLoading, error, refetch } = useClassReport(roomId);
  const reportExport = useClassReportExport(roomId, data?.sala?.nome);

  return (
    <div className="min-h-dvh bg-surface pb-16">
      <ClassReportHeader sala={data?.sala} roomId={roomId} />

      <main className={cn(PAGE_CONTAINER_CLASS, 'mt-6 flex flex-col gap-6')}>
        {isLoading && (
          <div className="mt-16 flex flex-col items-center justify-center gap-3">
            <Spinner className="size-8 text-brand-900" />
            <p className="text-sm text-muted">Carregando relatório final...</p>
          </div>
        )}

        {!isLoading && error && <ClassReportErrorState message={error} onRetry={refetch} />}

        {!isLoading && !error && data && (
          <>
            {data.problemas.length === 0 ? (
              <ClassReportEmptyState type="no-problems" />
            ) : data.alunos.length === 0 ? (
              <ClassReportEmptyState type="no-students" />
            ) : (
              <>
                <ClassReportTable problemas={data.problemas} alunos={data.alunos} />
                <ClassReportExportActions
                  isExportingPDF={reportExport.isExportingPDF}
                  isExportingExcel={reportExport.isExportingExcel}
                  onExportPdf={() => reportExport.handleExport('PDF')}
                  onExportExcel={() => reportExport.handleExport('XLSX')}
                />
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default ClassReportPage;
