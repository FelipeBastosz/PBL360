import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Alert } from '@/components/ui/Alert';
import { ROUTES } from '@/routes/paths';
import type { CriterionInput } from '@/types/performanceTable';
import {
  TitleCard,
  FormActions,
} from '@/pages/performance-tables/components/CreatePerformanceTableCards';
import { CreatePerformanceTableModals } from '@/pages/performance-tables/components/CreatePerformanceTableModals';
import { MyFormulasHeader } from './components/MyFormulasHeader';
import { useCreateMyFormula } from './hooks/useCreateMyFormula';

function CriterionRow({
  item,
  onEdit,
  onDelete,
}: {
  item: CriterionInput;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="border-b border-border-subtle px-4 py-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-brand-accent">{item.nome}</span>
        <span className="inline-flex min-w-9 items-center justify-center rounded-full bg-subtle px-3 py-1 text-xs font-bold text-ink">
          {item.peso}
        </span>
      </div>
      <div className="mt-1 flex items-center justify-between">
        <span className="text-xs text-muted">{item.descricao || 'Sem descrição'}</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onEdit}
            aria-label={`Editar critério ${item.nome}`}
            className="text-brand-accent hover:opacity-80"
          >
            <PencilIcon className="size-5" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            aria-label={`Excluir critério ${item.nome}`}
            className="text-danger hover:opacity-80"
          >
            <TrashIcon className="size-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function CriteriaCard({
  items,
  onOpenAdd,
  onOpenEdit,
  onOpenDelete,
  hasError,
}: {
  items: CriterionInput[];
  onOpenAdd: () => void;
  onOpenEdit: (criterion: CriterionInput) => void;
  onOpenDelete: (criterion: CriterionInput) => void;
  hasError: boolean;
}) {
  return (
    <div
      className={`overflow-hidden rounded-[14px] border bg-elevated shadow-sm ${
        hasError ? 'border-danger' : 'border-border-subtle'
      }`}
    >
      <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3 text-sm font-semibold text-brand-accent">
        <span>Critério</span>
        <span>Peso</span>
      </div>
      <div>
        {items.map((item, index) => (
          <CriterionRow
            key={`${item.nome}-${index}`}
            item={item}
            onEdit={() => onOpenEdit(item)}
            onDelete={() => onOpenDelete(item)}
          />
        ))}
      </div>
      <button
        type="button"
        onClick={onOpenAdd}
        className="w-full px-4 py-3 text-left text-sm font-semibold text-brand-accent transition-colors hover:bg-brand-soft"
      >
        +Adicionar critério
      </button>
    </div>
  );
}

function MyFormulaCreateModals({ state }: { state: ReturnType<typeof useCreateMyFormula> }) {
  return (
    <CreatePerformanceTableModals
      isAddModalOpen={state.isAddModalOpen}
      onCloseAddModal={() => state.setIsAddModalOpen(false)}
      onAddCriterion={(c) => {
        state.setCriterios((prev) => [...prev, c]);
        state.setFieldErrors((prev) => ({ ...prev, criterios: false }));
      }}
      nextOrder={state.criterios.length + 1}
      totalWeight={state.totalWeight}
      editingCriterion={state.editingCriterion}
      onCloseEditModal={() => state.setEditingCriterion(null)}
      onSaveCriterion={(upd) =>
        state.setCriterios((prev) => prev.map((c) => (c.ordem === upd.ordem ? upd : c)))
      }
      otherWeightsSum={state.otherWeightsSum}
      criterionToDelete={state.criterionToDelete}
      onCloseDeleteCriterion={() => state.setCriterionToDelete(null)}
      onConfirmDeleteCriterion={() => {
        if (!state.criterionToDelete) return;
        state.setCriterios((prev) =>
          prev.filter((c) => c.ordem !== state.criterionToDelete?.ordem),
        );
        state.setCriterionToDelete(null);
      }}
    />
  );
}

export function CreateMyFormulaPage() {
  const formState = useCreateMyFormula();

  return (
    <div className="min-h-dvh bg-surface pb-12">
      <MyFormulasHeader title={formState.nome || 'Nova fórmula'} />
      <main className="mx-auto mt-4 flex w-full max-w-md flex-col gap-4 px-4">
        {formState.errorMessage && <Alert tone="error">{formState.errorMessage}</Alert>}
        <TitleCard
          value={formState.nome}
          onChange={(v) => {
            formState.setNome(v);
            formState.setFieldErrors((prev) => ({ ...prev, nome: false }));
          }}
          hasError={Boolean(formState.fieldErrors.nome)}
        />
        <CriteriaCard
          items={formState.criterios}
          onOpenAdd={() => formState.setIsAddModalOpen(true)}
          onOpenEdit={formState.setEditingCriterion}
          onOpenDelete={formState.setCriterionToDelete}
          hasError={Boolean(formState.fieldErrors.criterios)}
        />
        <FormActions
          onSave={formState.handleSave}
          onCancel={() => formState.navigate(ROUTES.myFormulas)}
        />
      </main>

      <MyFormulaCreateModals state={formState} />
    </div>
  );
}

export default CreateMyFormulaPage;
