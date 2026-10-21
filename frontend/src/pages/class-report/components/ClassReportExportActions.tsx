import { Button } from '@/components/ui/Button';

type ClassReportExportActionsProps = {
  onExportPdf?: () => void;
  onExportExcel?: () => void;
};

export function ClassReportExportActions({
  onExportPdf,
  onExportExcel,
}: ClassReportExportActionsProps) {
  const handleExportPdf = () => {
    if (onExportPdf) {
      onExportPdf();
    } else {
      alert('Exportação em PDF será disponibilizada em breve.');
    }
  };

  const handleExportExcel = () => {
    if (onExportExcel) {
      onExportExcel();
    } else {
      alert('Exportação em Excel será disponibilizada em breve.');
    }
  };

  return (
    <div className="flex flex-col gap-3 pt-2">
      <Button
        type="button"
        variant="primary"
        onClick={handleExportPdf}
        className="h-12 w-full rounded-2xl bg-brand-900 font-semibold text-white shadow-md hover:bg-brand-700 active:scale-[0.99]"
      >
        Exportar em PDF
      </Button>
      <Button
        type="button"
        variant="primary"
        onClick={handleExportExcel}
        className="h-12 w-full rounded-2xl bg-brand-900 font-semibold text-white shadow-md hover:bg-brand-700 active:scale-[0.99]"
      >
        Exportar em Excel
      </Button>
    </div>
  );
}
