import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { performanceTableService } from '@/services/performance-table.service';
import { ROUTES } from '@/routes/paths';
import type { CriterionInput } from '@/types/performanceTable';
import { EditCriteriaCard } from './components/EditCriteriaCard';
import { DescriptionCard, EditActions } from './components/EditPerformanceTableCards';
import { EditPerformanceTableModals } from './components/EditPerformanceTableModals';
import { DiscardChangesModal } from './components/DiscardChangesModal';

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

function validateEditFormula(nome: string, count: number, totalWeight: number) {
  if (!nome.trim()) return 'O título da fórmula é obrigatório.';
  if (count === 0) return 'A tabela deve possuir ao menos um critério.';
  if (totalWeight !== 10) return 'A soma dos pesos dos critérios deve ser exatamente 10.';
  return null;
}

function checkIsDirty(
  current: { nome: string; descricao: string; criterios: CriterionInput[] },
  initial: { nome: string; descricao: string; criterios: CriterionInput[] } | null,
) {
  if (!initial) return false;
  return (
    current.nome !== initial.nome ||
    current.descricao !== initial.descricao ||
    JSON.stringify(current.criterios) !== JSON.stringify(initial.criterios)
  );
}

async function submitUpdate(
  id: string,
  payload: { nome: string; descricao: string | null; criterios: CriterionInput[] },
  notify: (t: { tone: 'success'; message: string }) => void,
  navigate: (to: string, opts?: { replace?: boolean }) => void,
) {
  await performanceTableService.update(id, payload);
  notify({ tone: 'success', message: 'Fórmula atualizada com sucesso.' });
  navigate(ROUTES.performanceTables, { replace: true });
}

function useFetchTableInitialData(id: string) {
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [criterios, setCriterios] = useState<CriterionInput[]>([]);
  const [initialData, setInitialData] = useState<{
    nome: string;
    descricao: string;
    criterios: CriterionInput[];
  } | null>(null);

  const fetchTable = useCallback(() => performanceTableService.getById(id), [id]);
  const { run, isLoading, error } = useAsyncAction(fetchTable);

  useEffect(() => {
    run().then((res) => {
      if (res.ok) {
        setNome(res.data.nome);
        setDescricao(res.data.descricao || '');
        setCriterios(res.data.criterios);
        setInitialData({
          nome: res.data.nome,
          descricao: res.data.descricao || '',
          criterios: res.data.criterios,
        });
      }
    });
  }, [run]);

  return {
    nome,
    setNome,
    descricao,
    setDescricao,
    criterios,
    setCriterios,
    initialData,
    isLoading,
    error,
  };
}

function useEditPerformanceTableForm(id: string) {
  const navigate = useNavigate();
  const { notify } = useToast();
  const data = useFetchTableInitialData(id);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isDirty = useMemo(
    () =>
      checkIsDirty(
        { nome: data.nome, descricao: data.descricao, criterios: data.criterios },
        data.initialData,
      ),
    [data.nome, data.descricao, data.criterios, data.initialData],
  );

  async function handleSave() {
    setErrorMessage(null);
    const totalWeight = data.criterios.reduce((sum, c) => sum + c.peso, 0);
    const err = validateEditFormula(data.nome, data.criterios.length, totalWeight);
    if (err) return setErrorMessage(err);
    try {
      await submitUpdate(
        id,
        {
          nome: data.nome.trim(),
          descricao: data.descricao.trim() || null,
          criterios: data.criterios,
        },
        notify,
        navigate,
      );
    } catch (caught: unknown) {
      setErrorMessage(caught instanceof Error ? caught.message : 'Erro ao atualizar a fórmula.');
    }
  }

  return { ...data, errorMessage, isDirty, handleSave, navigate };
}

function useEditModals(setCriterios: React.Dispatch<React.SetStateAction<CriterionInput[]>>) {
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCriterion, setEditingCriterion] = useState<CriterionInput | null>(null);

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
    handleSaveCriterion,
  };
}

type MainContentProps = {
  form: ReturnType<typeof useEditPerformanceTableForm>;
  onOpenInfo: () => void;
  onOpenAdd: () => void;
  onOpenEdit: (c: CriterionInput) => void;
  onExit: () => void;
};

function EditMainContent({ form, onOpenInfo, onOpenAdd, onOpenEdit, onExit }: MainContentProps) {
  if (form.isLoading) {
    return (
      <div className="mt-12 flex justify-center">
        <Spinner className="size-8 text-brand-900" />
      </div>
    );
  }

  return (
    <>
      <DescriptionCard description={form.descricao} onOpenEdit={onOpenInfo} />
      <EditCriteriaCard items={form.criterios} onOpenAdd={onOpenAdd} onOpenEdit={onOpenEdit} />
      <EditActions onSave={form.handleSave} onCancel={onExit} />
    </>
  );
}

type ModalsProps = {
  form: ReturnType<typeof useEditPerformanceTableForm>;
  modals: ReturnType<typeof useEditModals>;
  totalWeight: number;
  otherWeightsSum: number;
};

function EditModalsSection({ form, modals, totalWeight, otherWeightsSum }: ModalsProps) {
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
    />
  );
}

export function EditPerformanceTablePage() {
  const { id } = useParams<{ id: string }>();
  const form = useEditPerformanceTableForm(id!);
  const modals = useEditModals(form.setCriterios);
  const [isDiscardModalOpen, setIsDiscardModalOpen] = useState(false);

  const totalWeight = form.criterios.reduce((sum, c) => sum + c.peso, 0);
  const otherWeightsSum = modals.editingCriterion
    ? totalWeight - modals.editingCriterion.peso
    : totalWeight;

  function handleExit() {
    if (form.isDirty) {
      setIsDiscardModalOpen(true);
    } else {
      form.navigate(-1);
    }
  }

  return (
    <div className="min-h-dvh bg-surface pb-12">
      <Header title={form.nome || 'Sessão de apresentação'} onBack={handleExit} />
      <main className="mx-auto mt-4 flex w-full max-w-md flex-col gap-4 px-4">
        {(form.errorMessage || form.error) && (
          <Alert tone="error">{form.errorMessage || form.error?.message}</Alert>
        )}
        <EditMainContent
          form={form}
          onOpenInfo={() => modals.setIsInfoModalOpen(true)}
          onOpenAdd={() => modals.setIsAddModalOpen(true)}
          onOpenEdit={modals.setEditingCriterion}
          onExit={handleExit}
        />
      </main>
      <EditModalsSection
        form={form}
        modals={modals}
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
