import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeftIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { Alert } from '@/components/ui/Alert';
import { useAuth } from '@/hooks/useAuth';
import { performanceTableService } from '@/services/performance-table.service';
import { ROUTES } from '@/routes/paths';
import type { CriterionInput } from '@/types/performanceTable';
import { AddCriterionModal } from './components/AddCriterionModal';

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

function TitleCard({
  value,
  onChange,
  hasError,
}: {
  value: string;
  onChange: (v: string) => void;
  hasError: boolean;
}) {
  return (
    <div className="rounded-[14px] border border-black/5 bg-white p-4 shadow-sm">
      <label htmlFor="title-input" className="text-sm font-semibold text-brand-900">
        Título da Fórmula
      </label>
      <input
        id="title-input"
        type="text"
        placeholder="Fórmula Padrão"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`mt-2 h-12 w-full rounded-[10px] border px-4 text-sm text-ink placeholder:text-placeholder focus:outline-none focus:ring-1 ${
          hasError
            ? 'border-danger focus:border-danger focus:ring-danger'
            : 'border-black/10 focus:border-brand-900 focus:ring-brand-900'
        }`}
      />
    </div>
  );
}

function CriterionRow({ item }: { item: CriterionInput }) {
  return (
    <div className="border-b border-black/5 px-4 py-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-brand-900">{item.nome}</span>
        <span className="rounded-full bg-brand-soft px-3 py-0.5 text-xs font-bold text-brand-900">
          {item.peso}
        </span>
      </div>
      <div className="mt-1 flex items-center justify-between">
        <span className="text-xs text-muted">{item.descricao || 'Sem descrição'}</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Editar critério"
            disabled
            className="text-brand-900 opacity-60"
          >
            <PencilIcon className="size-5" />
          </button>
          <button
            type="button"
            aria-label="Excluir critério"
            disabled
            className="text-danger opacity-60"
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
  onOpenModal,
  hasError,
}: {
  items: CriterionInput[];
  onOpenModal: () => void;
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
          <CriterionRow key={`${item.nome}-${index}`} item={item} />
        ))}
      </div>
      <button
        type="button"
        onClick={onOpenModal}
        className="w-full px-4 py-3 text-left text-sm font-semibold text-brand-900 transition-colors hover:bg-brand-50"
      >
        +Adicionar critério
      </button>
    </div>
  );
}

function FormActions({ onSave, onCancel }: { onSave: () => void; onCancel: () => void }) {
  return (
    <div className="mt-8 flex flex-col gap-3">
      <button
        type="button"
        onClick={onSave}
        className="w-full rounded-[14px] bg-brand-900 py-3.5 text-base font-bold text-white shadow-lg transition-transform hover:bg-brand-800 active:scale-[0.98]"
      >
        Salvar Fórmula
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="text-center text-sm font-semibold text-brand-900 underline hover:opacity-80"
      >
        Cancelar
      </button>
    </div>
  );
}

function validateFormula(nome: string, count: number, totalWeight: number) {
  if (!nome.trim()) {
    return { error: 'O título da fórmula é obrigatório.', fields: { nome: true } };
  }
  if (count === 0) {
    return {
      error: 'A tabela de desempenho deve possuir ao menos um critério.',
      fields: { criterios: true },
    };
  }
  if (totalWeight > 10) {
    return {
      error: 'A soma dos pesos dos critérios não pode ser maior que 10.',
      fields: { criterios: true },
    };
  }
  return null;
}

function useCreatePerformanceTableForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const initialData = (location.state as { nome?: string; descricao?: string }) || {};

  const [nome, setNome] = useState(initialData.nome || '');
  const [descricao] = useState(initialData.descricao || '');
  const [criterios, setCriterios] = useState<CriterionInput[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ nome?: boolean; criterios?: boolean }>({});

  const totalWeight = criterios.reduce((acc, c) => acc + c.peso, 0);

  async function handleSave() {
    setErrorMessage(null);
    const validation = validateFormula(nome, criterios.length, totalWeight);
    if (validation) {
      setErrorMessage(validation.error);
      setFieldErrors(validation.fields);
      return;
    }
    try {
      await performanceTableService.create({
        nome: nome.trim(),
        descricao: descricao.trim() || undefined,
        criterios,
      });
      navigate(ROUTES.performanceTables, { replace: true });
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Ocorreu um erro ao salvar a fórmula.');
    }
  }

  return {
    nome,
    setNome,
    criterios,
    setCriterios,
    totalWeight,
    isModalOpen,
    setIsModalOpen,
    errorMessage,
    fieldErrors,
    setFieldErrors,
    handleSave,
    navigate,
  };
}

export function CreatePerformanceTablePage() {
  const form = useCreatePerformanceTableForm();

  return (
    <div className="min-h-dvh bg-surface pb-12">
      <Header title={form.nome || 'Sessão de apresentação'} />
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
          onOpenModal={() => form.setIsModalOpen(true)}
          hasError={Boolean(form.fieldErrors.criterios)}
        />

        <FormActions onSave={form.handleSave} onCancel={() => form.navigate(-1)} />
      </main>

      <AddCriterionModal
        isOpen={form.isModalOpen}
        onClose={() => form.setIsModalOpen(false)}
        onAdd={(c) => {
          form.setCriterios((prev) => [...prev, c]);
          form.setFieldErrors((prev) => ({ ...prev, criterios: false }));
        }}
        nextOrder={form.criterios.length + 1}
        currentTotalWeight={form.totalWeight}
      />
    </div>
  );
}

export default CreatePerformanceTablePage;
