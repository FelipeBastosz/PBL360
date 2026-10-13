import { useState } from 'react';
import { ChevronLeftIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { Alert } from '@/components/ui/Alert';
import { useAuth } from '@/hooks/useAuth';
import type { CriterionInput } from '@/types/performanceTable';
import { TitleCard, FormActions } from './components/CreatePerformanceTableCards';
import { CreatePerformanceTableModals } from './components/CreatePerformanceTableModals';
import { useCreatePerformanceTableForm } from './hooks/useCreatePerformanceTableForm';
import { PAGE_CONTAINER_CLASS } from '@/components/ui/cardStyles';
import { cn } from '@/utils/cn';

function Header({ title, onBack }: { title: string; onBack: () => void }) {
  const { user } = useAuth();

  return (
    <header className="shrink-0 bg-brand-900 text-white">
      <div className={cn(PAGE_CONTAINER_CLASS, 'flex h-16 items-center justify-between')}>
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            aria-label="Voltar"
            className="-ml-1 rounded-full p-2 transition-[background-color,scale] duration-200 hover:bg-white/10 active:scale-90 focus-visible:outline-2 focus-visible:outline-white"
          >
            <ChevronLeftIcon className="size-6" strokeWidth={2} />
          </button>
          <h1 className="text-lg font-bold">{title}</h1>
        </div>
        <UserAvatar user={user} />
      </div>
    </header>
  );
}

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
    <div className="border-b border-black/5 px-4 py-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-brand-900">{item.nome}</span>
        <span className="inline-flex min-w-9 items-center justify-center rounded-full bg-gray-200 px-3 py-1 text-xs font-bold text-ink">
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
            className="text-brand-900 hover:opacity-80"
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
      className={`overflow-hidden rounded-[14px] border bg-white shadow-sm ${
        hasError ? 'border-danger' : 'border-black/5'
      }`}
    >
      <div className="flex items-center justify-between border-b border-black/5 px-4 py-3 text-sm font-semibold text-brand-900">
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
        className="w-full px-4 py-3 text-left text-sm font-semibold text-brand-900 transition-colors hover:bg-brand-50"
      >
        +Adicionar critério
      </button>
    </div>
  );
}

function useCreateCriteriaModals(
  setCriterios: React.Dispatch<React.SetStateAction<CriterionInput[]>>,
  totalWeight: number,
) {
  const [editingCriterion, setEditingCriterion] = useState<CriterionInput | null>(null);
  const [criterionToDelete, setCriterionToDelete] = useState<CriterionInput | null>(null);

  const otherWeightsSum = editingCriterion ? totalWeight - editingCriterion.peso : totalWeight;

  function handleSaveCriterion(upd: CriterionInput) {
    setCriterios((prev) => prev.map((c) => (c.ordem === upd.ordem ? upd : c)));
  }

  function handleDeleteCriterion() {
    if (!criterionToDelete) return;
    setCriterios((prev) => prev.filter((c) => c.ordem !== criterionToDelete.ordem));
    setCriterionToDelete(null);
  }

  return {
    editingCriterion,
    setEditingCriterion,
    criterionToDelete,
    setCriterionToDelete,
    otherWeightsSum,
    handleSaveCriterion,
    handleDeleteCriterion,
  };
}

type ModalsSectionProps = {
  form: ReturnType<typeof useCreatePerformanceTableForm>;
  modals: ReturnType<typeof useCreateCriteriaModals>;
};

function CreateModalsSection({ form, modals }: ModalsSectionProps) {
  return (
    <CreatePerformanceTableModals
      isAddModalOpen={form.isModalOpen}
      onCloseAddModal={() => form.setIsModalOpen(false)}
      onAddCriterion={(c) => {
        form.setCriterios((prev) => [...prev, c]);
        form.setFieldErrors((prev) => ({ ...prev, criterios: false }));
      }}
      nextOrder={form.criterios.length + 1}
      totalWeight={form.totalWeight}
      editingCriterion={modals.editingCriterion}
      onCloseEditModal={() => modals.setEditingCriterion(null)}
      onSaveCriterion={modals.handleSaveCriterion}
      otherWeightsSum={modals.otherWeightsSum}
      criterionToDelete={modals.criterionToDelete}
      onCloseDeleteCriterion={() => modals.setCriterionToDelete(null)}
      onConfirmDeleteCriterion={modals.handleDeleteCriterion}
    />
  );
}

export function CreatePerformanceTablePage() {
  const form = useCreatePerformanceTableForm();
  const modals = useCreateCriteriaModals(form.setCriterios, form.totalWeight);

  return (
    <div className="min-h-dvh bg-surface pb-12">
      <Header title={form.nome || 'Nova fórmula'} onBack={() => form.navigate(-1)} />
      <main className="mx-auto mt-4 flex w-full max-w-md flex-col gap-4 px-4">
        {form.errorMessage && <Alert tone="error">{form.errorMessage}</Alert>}
        <TitleCard
          value={form.nome}
          onChange={(v) => {
            form.setNome(v);
            form.setFieldErrors((prev) => ({ ...prev, nome: false }));
          }}
          hasError={Boolean(form.fieldErrors.nome)}
        />
        <CriteriaCard
          items={form.criterios}
          onOpenAdd={() => form.setIsModalOpen(true)}
          onOpenEdit={modals.setEditingCriterion}
          onOpenDelete={modals.setCriterionToDelete}
          hasError={Boolean(form.fieldErrors.criterios)}
        />
        <FormActions onSave={form.handleSave} onCancel={() => form.navigate(-1)} />
      </main>
      <CreateModalsSection form={form} modals={modals} />
    </div>
  );
}

export default CreatePerformanceTablePage;
