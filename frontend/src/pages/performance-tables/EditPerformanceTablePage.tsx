import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeftIcon, PencilIcon } from '@heroicons/react/24/outline';
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
import { EditPerformanceTableModals } from './components/EditPerformanceTableModals';

function Header({ title }: { title: string }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="flex h-16 shrink-0 items-center justify-between bg-brand-900 px-4 text-white">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} aria-label="Voltar" className="p-1">
          <ChevronLeftIcon className="size-6" strokeWidth={2} />
        </button>
        <h1 className="text-lg font-bold">{title}</h1>
      </div>
      <UserAvatar user={user} />
    </header>
  );
}

function DescriptionCard({
  description,
  onOpenEdit,
}: {
  description: string;
  onOpenEdit: () => void;
}) {
  return (
    <div className="rounded-[14px] border border-black/5 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-brand-900">Descrição</h2>
        <button
          type="button"
          onClick={onOpenEdit}
          aria-label="Editar descrição e título"
          className="text-brand-900"
        >
          <PencilIcon className="size-5" />
        </button>
      </div>
      <p className="mt-1 text-sm text-muted">{description || 'Sem descrição'}</p>
    </div>
  );
}

function EditActions({ onSave, onCancel }: { onSave: () => void; onCancel: () => void }) {
  return (
    <div className="mt-8 flex flex-col gap-3">
      <button
        type="button"
        disabled
        className="w-full rounded-[14px] bg-brand-900 py-3.5 text-base font-bold text-white shadow-lg opacity-80"
      >
        Excluir essa fórmula
      </button>
      <button
        type="button"
        onClick={onSave}
        className="w-full rounded-[14px] bg-brand-900 py-3.5 text-base font-bold text-white shadow-lg hover:bg-brand-800"
      >
        Concluir edição
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="text-center text-sm font-semibold text-brand-900 underline"
      >
        Cancelar
      </button>
    </div>
  );
}

function validateEditFormula(nome: string, count: number, totalWeight: number) {
  if (!nome.trim()) return 'O título da fórmula é obrigatório.';
  if (count === 0) return 'A tabela deve possuir ao menos um critério.';
  if (totalWeight !== 10) return 'A soma dos pesos dos critérios deve ser exatamente 10.';
  return null;
}

function useEditPerformanceTableForm(id: string) {
  const navigate = useNavigate();
  const { notify } = useToast();
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [criterios, setCriterios] = useState<CriterionInput[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchTable = useCallback(() => performanceTableService.getById(id), [id]);
  const { run, isLoading, error } = useAsyncAction(fetchTable);

  useEffect(() => {
    run().then((res) => {
      if (res.ok) {
        setNome(res.data.nome);
        setDescricao(res.data.descricao || '');
        setCriterios(res.data.criterios);
      }
    });
  }, [run]);

  async function handleSave() {
    setErrorMessage(null);
    const totalWeight = criterios.reduce((sum, c) => sum + c.peso, 0);
    const err = validateEditFormula(nome, criterios.length, totalWeight);
    if (err) return setErrorMessage(err);

    try {
      await performanceTableService.update(id, {
        nome: nome.trim(),
        descricao: descricao.trim() || null,
        criterios,
      });
      notify({ tone: 'success', message: 'Fórmula atualizada com sucesso.' });
      navigate(ROUTES.performanceTables, { replace: true });
    } catch (caught: unknown) {
      setErrorMessage(caught instanceof Error ? caught.message : 'Erro ao atualizar a fórmula.');
    }
  }

  return {
    nome,
    setNome,
    descricao,
    setDescricao,
    criterios,
    setCriterios,
    errorMessage,
    isLoading,
    error,
    handleSave,
    navigate,
  };
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
};

function EditMainContent({ form, onOpenInfo, onOpenAdd, onOpenEdit }: MainContentProps) {
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
      <EditActions onSave={form.handleSave} onCancel={() => form.navigate(-1)} />
    </>
  );
}

type ModalsSectionProps = {
  form: ReturnType<typeof useEditPerformanceTableForm>;
  modals: ReturnType<typeof useEditModals>;
  totalWeight: number;
  otherWeightsSum: number;
};

function EditModalsSection({ form, modals, totalWeight, otherWeightsSum }: ModalsSectionProps) {
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

  const totalWeight = form.criterios.reduce((sum, c) => sum + c.peso, 0);
  const otherWeightsSum = modals.editingCriterion
    ? totalWeight - modals.editingCriterion.peso
    : totalWeight;

  return (
    <div className="min-h-dvh bg-surface pb-12">
      <Header title={form.nome || 'Sessão de apresentação'} />
      <main className="mx-auto mt-4 flex w-full max-w-md flex-col gap-4 px-4">
        {(form.errorMessage || form.error) && (
          <Alert tone="error">{form.errorMessage || form.error?.message}</Alert>
        )}
        <EditMainContent
          form={form}
          onOpenInfo={() => modals.setIsInfoModalOpen(true)}
          onOpenAdd={() => modals.setIsAddModalOpen(true)}
          onOpenEdit={modals.setEditingCriterion}
        />
      </main>
      <EditModalsSection
        form={form}
        modals={modals}
        totalWeight={totalWeight}
        otherWeightsSum={otherWeightsSum}
      />
    </div>
  );
}

export default EditPerformanceTablePage;
