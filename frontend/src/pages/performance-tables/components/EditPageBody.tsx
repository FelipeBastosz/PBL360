import { LockClosedIcon } from '@heroicons/react/24/outline';
import { Alert } from '@/components/ui/Alert';
import { PAGE_CONTAINER_CLASS } from '@/components/ui/cardStyles';
import { cn } from '@/utils/cn';
import { EditMainContent } from './EditMainContent';
import type { useEditPerformanceTableForm } from '../hooks/useEditPerformanceTableForm';
import type { useEditModals } from '../hooks/useEditModals';

type Props = {
  form: ReturnType<typeof useEditPerformanceTableForm>;
  modals: ReturnType<typeof useEditModals>;
  canEditCriteria: boolean;
  isSessionContext: boolean;
  totalWeight: number;
  onRequestSave: () => void;
  onExit: () => void;
};

export function EditPageBody({
  form,
  modals,
  canEditCriteria,
  isSessionContext,
  totalWeight,
  onRequestSave,
  onExit,
}: Props) {
  return (
    <main className={cn(PAGE_CONTAINER_CLASS, 'mt-4 flex flex-col gap-4')}>
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
        totalWeight={totalWeight}
        onRequestSave={onRequestSave}
        onExit={onExit}
      />
    </main>
  );
}
