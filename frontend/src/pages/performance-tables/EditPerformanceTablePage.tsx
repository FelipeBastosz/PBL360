import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { performanceTableService } from '@/services/performance-table.service';
import { ROUTES } from '@/routes/paths';
import type { CriterionInput } from '@/types/performanceTable';
import { EditCriteriaCard } from './components/EditCriteriaCard';
import { DescriptionCard, EditActions } from './components/EditPerformanceTableCards';
import { EditPerformanceTableModals } from './components/EditPerformanceTableModals';
import { DiscardChangesModal } from './components/DiscardChangesModal';
import { useEditPerformanceTableForm } from './hooks/useEditPerformanceTableForm';

function Header({ title, onBack }: { title: string; onBack: () => void }) {
  const { user } = useAuth();

  return (
    <header className="flex h-16 shrink-0 items-center justify-between bg-brand-900 px-4 text-white">
      <div className="flex items-center gap-3">
        <button onClick={onBack} aria-label="Voltar" className="p-1">
          <ChevronLeftIcon className="size-6" strokeWidth={2} />
        </button>
        <h1 className="text-lg font-bold">{title}</h1>
      </div>
      <UserAvatar user={user} />
    </header>
  );
}

function useEditModals(setCriterios: React.Dispatch<React.SetStateAction<CriterionInput[]>>) {
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCriterion, setEditingCriterion] = useState<CriterionInput | null>(null);
  const [criterionToDelete, setCriterionToDelete] = useState<CriterionInput | null>(null);
  const [isDeleteFormulaOpen, setIsDeleteFormulaOpen] = useState(false);

  const handleSaveCriterion = (upd: CriterionInput) => {
    setCriterios((prev) =>
      prev.map((c) => ((c.id && c.id === upd.id) || c.ordem === upd.ordem ? upd : c)),
    );
  };

  return {
    isInfoModalOpen,
    setIsInfoModalOpen,
    isAddModalOpen,
    setIsAddModalOpen,
    editingCriterion,
    setEditingCriterion,
    criterionToDelete,
    setCriterionToDelete,
    isDeleteFormulaOpen,
    setIsDeleteFormulaOpen,
    handleSaveCriterion,
  };
}

function useEditPageDeletion(
  id: string,
  form: ReturnType<typeof useEditPerformanceTableForm>,
  modals: ReturnType<typeof useEditModals>,
  notify: (t: { tone: 'success'; message: string }) => void,
) {
  const [isDeletingFormula, setIsDeletingFormula] = useState(false);

  function handleConfirmDeleteCriterion() {
    if (!modals.criterionToDelete) return;
    if (form.criterios.length <= 1) {
      form.setErrorMessage('A fórmula deve possuir ao menos um critério.');
      modals.setCriterionToDelete(null);
      return;
    }
    form.setCriterios((prev) =>
      prev.filter((c) =>
        c.id ? c.id !== modals.criterionToDelete!.id : c.ordem !== modals.criterionToDelete!.ordem,
      ),
    );
    modals.setCriterionToDelete(null);
  }

  async function handleConfirmDeleteFormula() {
    setIsDeletingFormula(true);
    try {
      await performanceTableService.remove(id);
      notify({ tone: 'success', message: 'Fórmula excluída com sucesso.' });
      form.navigate(ROUTES.performanceTables, { replace: true });
    } catch (err: unknown) {
      form.setErrorMessage(err instanceof Error ? err.message : 'Erro ao excluir a fórmula.');
    } finally {
      setIsDeletingFormula(false);
      modals.setIsDeleteFormulaOpen(false);
    }
  }

  return { isDeletingFormula, handleConfirmDeleteCriterion, handleConfirmDeleteFormula };
}

type MainContentProps = {
  form: ReturnType<typeof useEditPerformanceTableForm>;
  modals: ReturnType<typeof useEditModals>;
  onExit: () => void;
};

function EditMainContent({ form, modals, onExit }: MainContentProps) {
  if (form.isLoading) {
    return (
      <div className="mt-12 flex justify-center">
        <Spinner className="size-8 text-brand-900" />
      </div>
    );
  }

  return (
    <>
      <DescriptionCard
        description={form.descricao}
        onOpenEdit={() => modals.setIsInfoModalOpen(true)}
      />
      <EditCriteriaCard
        items={form.criterios}
        onOpenAdd={() => modals.setIsAddModalOpen(true)}
        onOpenEdit={modals.setEditingCriterion}
        onOpenDelete={modals.setCriterionToDelete}
      />
      <EditActions
        onSave={form.handleSave}
        onCancel={onExit}
        onDeleteFormula={() => modals.setIsDeleteFormulaOpen(true)}
      />
    </>
  );
}

type ModalsSectionProps = {
  form: ReturnType<typeof useEditPerformanceTableForm>;
  modals: ReturnType<typeof useEditModals>;
  deletion: ReturnType<typeof useEditPageDeletion>;
  totalWeight: number;
  otherWeightsSum: number;
};

function ModalsSection({
  form,
  modals,
  deletion,
  totalWeight,
  otherWeightsSum,
}: ModalsSectionProps) {
  return (
    <EditPerformanceTableModals
      isInfoModalOpen={modals.isInfoModalOpen}
      onCloseInfoModal={() => modals.setIsInfoModalOpen(false)}
      initialNome={form.nome}
      initialDescricao={form.descricao}
      onSaveInfo={({ nome, descricao }) => {
        form.setNome(nome);
        form.setDescricao(descricao);
      }}
      isAddModalOpen={modals.isAddModalOpen}
      onCloseAddModal={() => modals.setIsAddModalOpen(false)}
      onAddCriterion={(c) => form.setCriterios((prev) => [...prev, c])}
      nextOrder={form.criterios.length + 1}
      totalWeight={totalWeight}
      editingCriterion={modals.editingCriterion}
      onCloseEditModal={() => modals.setEditingCriterion(null)}
      onSaveCriterion={modals.handleSaveCriterion}
      otherWeightsSum={otherWeightsSum}
      criterionToDelete={modals.criterionToDelete}
      onCloseDeleteCriterion={() => modals.setCriterionToDelete(null)}
      onConfirmDeleteCriterion={deletion.handleConfirmDeleteCriterion}
      isDeleteFormulaOpen={modals.isDeleteFormulaOpen}
      isDeletingFormula={deletion.isDeletingFormula}
      onCloseDeleteFormula={() => modals.setIsDeleteFormulaOpen(false)}
      onConfirmDeleteFormula={deletion.handleConfirmDeleteFormula}
    />
  );
}

export function EditPerformanceTablePage() {
  const { id } = useParams<{ id: string }>();
  const form = useEditPerformanceTableForm(id!);
  const modals = useEditModals(form.setCriterios);
  const { notify } = useToast();
  const [isDiscardModalOpen, setIsDiscardModalOpen] = useState(false);
  const deletion = useEditPageDeletion(id!, form, modals, notify);

  const totalWeight = form.criterios.reduce((sum, c) => sum + c.peso, 0);
  const otherWeightsSum = modals.editingCriterion
    ? totalWeight - modals.editingCriterion.peso
    : totalWeight;
  const handleExit = () => (form.isDirty ? setIsDiscardModalOpen(true) : form.navigate(-1));

  return (
    <div className="min-h-dvh bg-surface pb-12">
      <Header title={form.nome || 'Sessão de apresentação'} onBack={handleExit} />
      <main className="mx-auto mt-4 flex w-full max-w-md flex-col gap-4 px-4">
        {(form.errorMessage || form.error) && (
          <Alert tone="error">{form.errorMessage || form.error?.message}</Alert>
        )}
        <EditMainContent form={form} modals={modals} onExit={handleExit} />
      </main>
      <ModalsSection
        form={form}
        modals={modals}
        deletion={deletion}
        totalWeight={totalWeight}
        otherWeightsSum={otherWeightsSum}
      />
      <DiscardChangesModal
        isOpen={isDiscardModalOpen}
        onConfirm={() => form.navigate(-1)}
        onCancel={() => setIsDiscardModalOpen(false)}
      />
    </div>
  );
}

export default EditPerformanceTablePage;
