import { ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';

type ClassReportErrorStateProps = {
  message: string;
  onRetry: () => void;
};

export function ClassReportErrorState({ message, onRetry }: ClassReportErrorStateProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center rounded-3xl border border-black/5 bg-white p-12 text-center shadow-sm"
    >
      <div className="flex size-16 items-center justify-center rounded-full bg-danger-soft text-danger">
        <ExclamationCircleIcon className="size-8" aria-hidden="true" />
      </div>
      <h2 className="mt-4 text-base font-semibold text-ink">Falha ao carregar relatório</h2>
      <p className="mt-1 max-w-md text-sm text-muted">{message}</p>
      <div className="mt-6">
        <Button variant="primary" onClick={onRetry} className="h-11 px-6 text-sm">
          Tentar novamente
        </Button>
      </div>
    </div>
  );
}
