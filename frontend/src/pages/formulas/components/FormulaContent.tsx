import { Spinner } from '@/components/ui/Spinner';
import { FormulaNewCard } from './FormulaNewCard';
import { FormulaCardsList } from './FormulaCardsList';
import { EmptyCustomFormulasNotice } from './EmptyCustomFormulasNotice';
import type { useFormulaList } from '../hooks/useFormulaList';
import type { FormulasManager } from '../hooks/useFormulasManager';

type Props = {
  list: ReturnType<typeof useFormulaList>;
  manager: FormulasManager;
  showSnackbar: (msg: string) => void;
};

export function FormulaContent({ list, manager, showSnackbar }: Props) {
  if (list.isListLoading) {
    return (
      <div className="flex justify-center mt-10">
        <Spinner className="size-8 text-brand-900" />
      </div>
    );
  }

  const hasCustomFormulas = list.filteredSummaries.some((s) => !s.isDefault);

  return (
    <div className="flex flex-col">
      {manager.isCreatingNew && (
        <FormulaNewCard
          draft={manager.draft}
          onSave={manager.handleSave}
          onUpdateDraft={manager.setDraft}
          onCancel={() => {
            manager.setIsCreatingNew(false);
            manager.setDraft(null);
            manager.setExpandedId(null);
          }}
        />
      )}
      <FormulaCardsList
        summaries={list.filteredSummaries}
        loadedDetails={list.loadedDetails}
        manager={manager}
        onRemove={(id) => list.setSummaries((p) => p.filter((s) => s.id !== id))}
        showSnackbar={showSnackbar}
      />
      {!hasCustomFormulas && !manager.isCreatingNew && <EmptyCustomFormulasNotice />}
    </div>
  );
}
