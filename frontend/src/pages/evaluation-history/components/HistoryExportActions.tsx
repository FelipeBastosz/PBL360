type HistoryExportActionsProps = {
  disabled: boolean;
  onExportPdf: () => void;
  onExportExcel: () => void;
};

function ExportButton({
  label,
  ...props
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <div className="h-[54.7px] rounded-[10px] bg-[#F2F2F7]">
      <button
        type="button"
        {...props}
        className="h-[51px] w-full rounded-[17px] pt-[5px] bg-brand-900 text-[17px] leading-none font-bold text-white shadow-[0_11px_25px_-11px_#000077] transition-[background-color,scale] duration-200 hover:bg-brand-700 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-900 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {label}
      </button>
    </div>
  );
}

// Pinned to the bottom of the screen on phones, as in the mobile layout; inline from sm up.
export function HistoryExportActions({
  disabled,
  onExportPdf,
  onExportExcel,
}: HistoryExportActionsProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-20 bg-surface pt-1 pr-[21px] pl-[27px] pb-[max(5.3px,env(safe-area-inset-bottom))] sm:static sm:mt-6 sm:bg-transparent sm:p-0">
      <div className="mx-auto flex w-full max-w-[720px] flex-col gap-[15.3px] sm:grid sm:grid-cols-2 sm:gap-4">
        <ExportButton label="Exportar em PDF" disabled={disabled} onClick={onExportPdf} />
        <ExportButton label="Exportar em Excel" disabled={disabled} onClick={onExportExcel} />
      </div>
    </div>
  );
}
