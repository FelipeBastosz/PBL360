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
import { SaveFormulaWarningModal } from './components/SaveFormulaWarningModal';
import { useEditPerformanceTableForm } from './hooks/useEditPerformanceTableForm';
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
  onRequestSave: () => void;
  onExit: () => void;
};

function EditMainContent({ form, modals, onRequestSave, onExit }: MainContentProps) {
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
        onSave={onRequestSave}
        onCancel={onExit}
        onDeleteFormula={() => modals.setIsDeleteFormulaOpen(true)}
      />
    </>
  );
}

type ModalsProps = {
  form: ReturnType<typeof useEditPerformanceTableForm>;
  modals: ReturnType<typeof useEditModals>;
  totalWeight: number;
  otherWeightsSum: number;
  onConfirmDeleteCriterion: () => void;
  isDeletingFormula: boolean;
  onConfirmDeleteFormula: () => void;
  isDiscardOpen: boolean;
  onCloseDiscard: () => void;
  isSaveWarningOpen: boolean;
  onCloseSaveWarning: () => void;
};

function EditModalsSection(props: ModalsProps) {
  return (
    <>
      <EditPerformanceTableModals
        isInfoModalOpen={props.modals.isInfoModalOpen}
        onCloseInfoModal={() => props.modals.setIsInfoModalOpen(false)}
        initialNome={props.form.nome}
        initialDescricao={props.form.descricao}
        onSaveInfo={({ nome, descricao }) => {
          props.form.setNome(nome);
          props.form.setDescricao(descricao);
        }}
        isAddModalOpen={props.modals.isAddModalOpen}
        onCloseAddModal={() => props.modals.setIsAddModalOpen(false)}
        onAddCriterion={(c) => props.form.setCriterios((prev) => [...prev, c])}
        nextOrder={props.form.criterios.length + 1}
        totalWeight={props.totalWeight}
        editingCriterion={props.modals.editingCriterion}
        onCloseEditModal={() => props.modals.setEditingCriterion(null)}
        onSaveCriterion={props.modals.handleSaveCriterion}
        otherWeightsSum={props.otherWeightsSum}
        criterionToDelete={props.modals.criterionToDelete}
        onCloseDeleteCriterion={() => props.modals.setCriterionToDelete(null)}
        onConfirmDeleteCriterion={props.onConfirmDeleteCriterion}
        isDeleteFormulaOpen={props.modals.isDeleteFormulaOpen}
        isDeletingFormula={props.isDeletingFormula}
        onCloseDeleteFormula={() => props.modals.setIsDeleteFormulaOpen(false)}
        onConfirmDeleteFormula={props.onConfirmDeleteFormula}
      />
      <DiscardChangesModal
        isOpen={props.isDiscardOpen}
        onConfirm={() => props.form.navigate(-1)}
        onCancel={props.onCloseDiscard}
      />
      <SaveFormulaWarningModal
        isOpen={props.isSaveWarningOpen}
        isLoading={props.form.isSaving}
        onConfirm={props.form.executeSave}
        onCancel={props.onCloseSaveWarning}
      />
    </>
  );
}

export function EditPerformanceTablePage() {
  const { id } = useParams<{ id: string }>();
  const form = useEditPerformanceTableForm(id!);
  const modals = useEditModals(form.setCriterios);
  const { notify } = useToast();
  const [isDiscardOpen, setIsDiscardOpen] = useState(false);
  const [isSaveWarningOpen, setIsSaveWarningOpen] = useState(false);
  const deletion = useEditPageDeletion(id!, form, modals, notify);

  const totalWeight = form.criterios.reduce((sum, c) => sum + c.peso, 0);
  const otherWeightsSum = modals.editingCriterion
    ? totalWeight - modals.editingCriterion.peso
    : totalWeight;
  const handleExit = () => (form.isDirty ? setIsDiscardOpen(true) : form.navigate(-1));
  const handleRequestSave = () => {
    if (form.prepareSave()) setIsSaveWarningOpen(true);
  };

  return (
    <div className="min-h-dvh bg-surface pb-12">
      <Header title={form.nome || 'Sessão de apresentação'} onBack={handleExit} />
      <main className="mx-auto mt-4 flex w-full max-w-md flex-col gap-4 px-4">
        {(form.errorMessage || form.error) && (
          <Alert tone="error">{form.errorMessage || form.error?.message}</Alert>
        )}
        <EditMainContent
          form={form}
          modals={modals}
          onRequestSave={handleRequestSave}
          onExit={handleExit}
        />
      </main>
      <EditModalsSection
        form={form}
        modals={modals}
        totalWeight={totalWeight}
        otherWeightsSum={otherWeightsSum}
        onConfirmDeleteCriterion={deletion.handleConfirmDeleteCriterion}
        isDeletingFormula={deletion.isDeletingFormula}
        onConfirmDeleteFormula={deletion.handleConfirmDeleteFormula}
        isDiscardOpen={isDiscardOpen}
        onCloseDiscard={() => setIsDiscardOpen(false)}
        isSaveWarningOpen={isSaveWarningOpen}
        onCloseSaveWarning={() => setIsSaveWarningOpen(false)}
      />
    </div>
  );
}

export default EditPerformanceTablePage;
