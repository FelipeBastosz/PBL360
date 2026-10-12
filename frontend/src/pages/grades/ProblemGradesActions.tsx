import { Button } from '@/components/ui/Button';

type ProblemGradesActionsProps = {
  onOpenGeneralModal: () => void;
};

function DisabledExportButton({ label }: { label: string }) {
  return (
    <div className="group relative">
      <button
        type="button"
        disabled
        title="Em breve"
        aria-label={label}
        className="flex h-12 w-full cursor-not-allowed items-center justify-center rounded-2xl bg-brand-900 font-semibold text-white opacity-60 shadow-md transition disabled:cursor-not-allowed"
      >
        {label}
      </button>
      <div
        role="tooltip"
        className="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md bg-ink px-2.5 py-1 text-xs text-white opacity-0 shadow transition-opacity group-focus-within:opacity-100 group-hover:opacity-100"
      >
        Em breve
      </div>
    </div>
  );
}

export function ProblemGradesActions({ onOpenGeneralModal }: ProblemGradesActionsProps) {
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
        <DisabledExportButton label="Exportar em PDF" />
        <DisabledExportButton label="Exportar em Excel" />
      </div>
    </div>
  );
}
