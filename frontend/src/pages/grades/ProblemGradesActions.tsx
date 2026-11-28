import { Button } from '@/components/ui/Button';

type ProblemGradesActionsProps = {
  isExportingPDF?: boolean;
  isExportingExcel?: boolean;
  onExport?: (formato: 'PDF' | 'XLSX') => void;
};

export function ProblemGradesActions({
  isExportingPDF = false,
  isExportingExcel = false,
  onExport,
}: ProblemGradesActionsProps) {
  const isAnyExporting = isExportingPDF || isExportingExcel;

  return (
    <div className="flex flex-col gap-2.5 pt-1">
      <Button
        type="button"
        isLoading={isExportingPDF}
        disabled={isAnyExporting}
        onClick={() => onExport?.('PDF')}
        className="h-12 w-full rounded-2xl bg-brand-primary font-semibold text-brand-on-primary shadow-md transition hover:bg-brand-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
      >
        Exportar em PDF
      </Button>
      <Button
        type="button"
        isLoading={isExportingExcel}
        disabled={isAnyExporting}
        onClick={() => onExport?.('XLSX')}
        className="h-12 w-full rounded-2xl bg-brand-primary font-semibold text-brand-on-primary shadow-md transition hover:bg-brand-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
      >
        Exportar em Excel
      </Button>
    </div>
  );
}
