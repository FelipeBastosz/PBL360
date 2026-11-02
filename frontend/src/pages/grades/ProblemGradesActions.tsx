import { Button } from '@/components/ui/Button';

type ProblemGradesActionsProps = {
  onOpenGeneralModal: () => void;
  isExportingPDF?: boolean;
  isExportingExcel?: boolean;
  onExport?: (formato: 'PDF' | 'XLSX') => void;
};

export function ProblemGradesActions({
  onOpenGeneralModal,
  isExportingPDF = false,
  isExportingExcel = false,
  onExport,
}: ProblemGradesActionsProps) {
  const isAnyExporting = isExportingPDF || isExportingExcel;

  return (
    <div className="flex flex-col gap-3">
      <Button
        type="button"
        variant="outline"
        onClick={onOpenGeneralModal}
        className="h-12 w-full rounded-2xl border-brand-900 bg-white font-semibold text-brand-900 hover:bg-brand-50"
      >
        Feedback geral da turma
      </Button>

      <div className="flex flex-col gap-2.5 pt-1">
        <Button
          type="button"
          isLoading={isExportingPDF}
          disabled={isAnyExporting}
          onClick={() => onExport?.('PDF')}
          className="h-12 w-full rounded-2xl bg-brand-900 font-semibold text-white shadow-md transition disabled:cursor-not-allowed disabled:opacity-60"
        >
          Exportar em PDF
        </Button>
        <Button
          type="button"
          isLoading={isExportingExcel}
          disabled={isAnyExporting}
          onClick={() => onExport?.('XLSX')}
          className="h-12 w-full rounded-2xl bg-brand-900 font-semibold text-white shadow-md transition disabled:cursor-not-allowed disabled:opacity-60"
        >
          Exportar em Excel
        </Button>
      </div>
    </div>
  );
}
