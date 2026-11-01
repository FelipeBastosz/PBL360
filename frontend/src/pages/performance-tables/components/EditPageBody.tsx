import { LockClosedIcon } from '@heroicons/react/24/outline';
import { Alert } from '@/components/ui/Alert';
import { EditMainContent } from './EditMainContent';
import type { useEditPerformanceTableForm } from '../hooks/useEditPerformanceTableForm';
import type { useEditModals } from '../hooks/useEditModals';

type Props = {
  form: ReturnType<typeof useEditPerformanceTableForm>;
  modals: ReturnType<typeof useEditModals>;
  canEditCriteria: boolean;
  isSessionContext: boolean;
  onRequestSave: () => void;
  onExit: () => void;
};

export function EditPageBody({
  form,
  modals,
  canEditCriteria,
  isSessionContext,
  onRequestSave,
  onExit,
}: Props) {
  return (
    <main className="mx-auto mt-4 flex w-full max-w-md flex-col gap-4 px-4">
      {form.permissions && !form.permissions.podeEditarCriterios && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 shadow-xs">
          <LockClosedIcon className="mt-0.5 size-4 shrink-0 text-amber-600" />
          <span>
            {form.permissions.motivo || 'Esta tabela já foi usada em sessões que aconteceram'}
          </span>
        </div>
      )}
      {(form.errorMessage || form.error) && (
        <Alert tone="error">{form.errorMessage || form.error?.message}</Alert>
      )}
      <EditMainContent
        form={form}
        modals={modals}
        canEditCriteria={canEditCriteria}
        isSessionContext={isSessionContext}
        onRequestSave={onRequestSave}
        onExit={onExit}
      />
    </main>
  );
}
