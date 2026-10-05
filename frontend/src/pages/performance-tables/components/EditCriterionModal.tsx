import { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import type { CriterionInput } from '@/types/performanceTable';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  criterion: CriterionInput | null;
  onSave: (updated: CriterionInput) => void;
  otherWeightsSum: number;
};

type FieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  hasError?: boolean;
};

function CriterionField({
  id,
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  hasError,
}: FieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-xs font-semibold text-brand-900">
        {label}
      </label>
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`h-10 w-full rounded-[10px] border px-3 text-sm text-ink ${
          hasError ? 'border-danger' : 'border-black/10'
        }`}
      />
    </div>
  );
}

function validateCriterion(nome: string, peso: string, otherWeightsSum: number) {
  if (!nome.trim()) return 'O nome do critério é obrigatório.';
  const parsed = Number(peso);
  if (Number.isNaN(parsed) || parsed < 1 || parsed > 10)
    return 'O peso do critério deve estar entre 1 e 10.';
  if (otherWeightsSum + parsed > 10)
    return `A soma total dos pesos não pode ultrapassar 10. Restante: ${10 - otherWeightsSum}.`;
  return null;
}

function FormSubmitButton() {
  return (
    <div className="mt-3 flex justify-center">
      <button
        type="submit"
        className="rounded-full bg-brand-900 px-8 py-2.5 text-sm font-bold text-white shadow-md hover:bg-brand-800"
      >
        Salvar Edição
      </button>
    </div>
  );
}

function useEditCriterionForm(
  criterion: CriterionInput,
  otherWeightsSum: number,
  onSave: (updated: CriterionInput) => void,
  onClose: () => void,
) {
  const [nome, setNome] = useState(criterion.nome);
  const [descricao, setDescricao] = useState(criterion.descricao || '');
  const [peso, setPeso] = useState(String(criterion.peso));
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const error = validateCriterion(nome, peso, otherWeightsSum);
    if (error) return setErrorMsg(error);

    onSave({
      ...criterion,
      nome: nome.trim(),
      descricao: descricao.trim() || undefined,
      peso: Number(peso),
    });
    onClose();
  }

  return {
    nome,
    setNome,
    descricao,
    setDescricao,
    peso,
    setPeso,
    errorMsg,
    setErrorMsg,
    handleSubmit,
  };
}

function EditCriterionForm({
  criterion,
  otherWeightsSum,
  onSave,
  onClose,
}: {
  criterion: CriterionInput;
  otherWeightsSum: number;
  onSave: (updated: CriterionInput) => void;
  onClose: () => void;
}) {
  const form = useEditCriterionForm(criterion, otherWeightsSum, onSave, onClose);

  return (
    <form noValidate onSubmit={form.handleSubmit} className="flex flex-col gap-3 pt-2">
      {form.errorMsg && <p className="text-xs font-semibold text-danger">{form.errorMsg}</p>}
      <CriterionField
        id="edit-criterion-name"
        label="Nome do Critério"
        placeholder="Critério"
        value={form.nome}
        onChange={(v) => {
          form.setNome(v);
          form.setErrorMsg(null);
        }}
        hasError={Boolean(form.errorMsg)}
      />
      <CriterionField
        id="edit-criterion-desc"
        label="Descrição do Critério"
        placeholder="Critério"
        value={form.descricao}
        onChange={form.setDescricao}
      />
      <CriterionField
        id="edit-criterion-weight"
        label="Peso"
        placeholder="0 - 10"
        type="number"
        value={form.peso}
        onChange={(v) => {
          form.setPeso(v);
          form.setErrorMsg(null);
        }}
        hasError={Boolean(form.errorMsg)}
      />
      <FormSubmitButton />
    </form>
  );
}

export function EditCriterionModal({ isOpen, onClose, criterion, onSave, otherWeightsSum }: Props) {
  if (!isOpen || !criterion) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="relative w-full max-w-sm rounded-[22px] bg-white p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="absolute right-5 top-5 flex size-7 items-center justify-center rounded-full border border-brand-900 text-brand-900 hover:bg-brand-50"
        >
          <XMarkIcon className="size-4 stroke-[2.5]" />
        </button>
        <EditCriterionForm
          key={criterion.id ?? criterion.ordem}
          criterion={criterion}
          otherWeightsSum={otherWeightsSum}
          onSave={onSave}
          onClose={onClose}
        />
      </div>
    </div>
  );
}
