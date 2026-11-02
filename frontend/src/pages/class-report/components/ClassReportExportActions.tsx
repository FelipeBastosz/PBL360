import { Button } from '@/components/ui/Button';

type ClassReportExportActionsProps = {
  isExportingPDF?: boolean;
  isExportingExcel?: boolean;
  onExportPdf?: () => void;
  onExportExcel?: () => void;
};

export function ClassReportExportActions({
  isExportingPDF = false,
  isExportingExcel = false,
  onExportPdf,
  onExportExcel,
}: ClassReportExportActionsProps) {
  const isAnyExporting = isExportingPDF || isExportingExcel;

  return (
    <div className="flex flex-col gap-3 pt-2">
      <Button
        type="button"
        variant="primary"
        isLoading={isExportingPDF}
        disabled={isAnyExporting}
        onClick={onExportPdf}
        className="h-12 w-full rounded-2xl bg-brand-900 font-semibold text-white shadow-md hover:bg-brand-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
      >
        Exportar em PDF
      </Button>
      <Button
        type="button"
        variant="primary"
        isLoading={isExportingExcel}
        disabled={isAnyExporting}
        onClick={onExportExcel}
        className="h-12 w-full rounded-2xl bg-brand-900 font-semibold text-white shadow-md hover:bg-brand-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
      >
        Exportar em Excel
      </Button>
    </div>
  );
}
