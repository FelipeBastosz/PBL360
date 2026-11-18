import { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import type { CriterionInput } from '@/types/performanceTable';
import {
  formatCriterionWeight,
  formatWeightChange,
  stepCriterionWeight,
} from '@/utils/criterionWeight';
import { CriterionWeightField } from './CriterionWeightField';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  criterion: CriterionInput | null;
  onSave: (updated: CriterionInput) => void;
  otherWeightsSum?: number;
  canEditFields?: boolean;
};

type FieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  hasError?: boolean;
  disabled?: boolean;
};

function CriterionField({
  id,
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  hasError,
  disabled = false,
}: FieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-xs font-semibold text-brand-900">
        {label}
      </label>
      <input
        id={id}
        type={type}
        disabled={disabled}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`h-10 w-full rounded-[10px] border px-3 text-sm text-ink ${
          disabled ? 'bg-black/5 opacity-60 cursor-not-allowed border-black/10' : ''
        } ${hasError ? 'border-danger' : 'border-black/10'}`}
      />
    </div>
  );
}

function validateCriterion(nome: string, peso: string) {
  if (!nome.trim()) return 'O nome do critério é obrigatório.';
  if (!peso.trim()) return 'O peso do critério é obrigatório.';
  const normalized = peso.trim().replace(',', '.');
  const parsed = Number(normalized);
  if (Number.isNaN(parsed) || parsed < 0 || parsed > 10)
    return 'O peso do critério deve estar entre 0 e 10.';
  const parts = normalized.split('.');
  if (parts[1] && parts[1].length > 1) {
    return 'O peso do critério deve ter no máximo uma casa decimal.';
  }
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
  onSave: (updated: CriterionInput) => void,
  onClose: () => void,
) {
  const [nome, setNome] = useState(criterion.nome);
  const [descricao, setDescricao] = useState(criterion.descricao || '');
  const [peso, setPeso] = useState(formatCriterionWeight(criterion.peso));
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  function handleWeightChange(raw: string) {
    const text = formatWeightChange(raw);
    if (text === null) return;
    setPeso(text);
    setErrorMsg(null);
  }

  function handleWeightStep(delta: number) {
    setPeso(stepCriterionWeight(peso, delta));
    setErrorMsg(null);
  }

  function handleWeightKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      handleWeightStep(e.key === 'ArrowUp' ? 1 : -1);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const error = validateCriterion(nome, peso);
    if (error) return setErrorMsg(error);

    const parsed = Number(peso.trim().replace(',', '.'));
    onSave({
      ...criterion,
      nome: nome.trim(),
      descricao: descricao.trim() || undefined,
      peso: Math.round((parsed + Number.EPSILON) * 10) / 10,
    });
    onClose();
  }

  return {
    nome,
    setNome,
    descricao,
    setDescricao,
    peso,
    handleWeightChange,
    handleWeightStep,
    handleWeightKeyDown,
    errorMsg,
    setErrorMsg,
    handleSubmit,
  };
}

function CriterionInputs({
  form,
  canEditFields,
}: {
  form: ReturnType<typeof useEditCriterionForm>;
  canEditFields: boolean;
}) {
  return (
    <>
      <CriterionField
        id="edit-criterion-name"
        label="Nome do Critério"
        placeholder="Critério"
        value={form.nome}
        disabled={!canEditFields}
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
        disabled={!canEditFields}
        onChange={form.setDescricao}
      />
      <CriterionWeightField
        id="edit-criterion-weight"
        label="Peso"
        placeholder="0 - 10"
        value={form.peso}
        onChange={form.handleWeightChange}
        onStep={form.handleWeightStep}
        onKeyDown={form.handleWeightKeyDown}
        hasError={Boolean(form.errorMsg)}
      />
    </>
  );
}

function EditCriterionForm({
  criterion,
  canEditFields = true,
  onSave,
  onClose,
}: {
  criterion: CriterionInput;
  otherWeightsSum?: number;
  canEditFields?: boolean;
  onSave: (updated: CriterionInput) => void;
  onClose: () => void;
}) {
  const form = useEditCriterionForm(criterion, onSave, onClose);

  return (
    <form noValidate onSubmit={form.handleSubmit} className="flex flex-col gap-3 pt-2">
      {form.errorMsg && <p className="text-xs font-semibold text-danger">{form.errorMsg}</p>}
      <CriterionInputs form={form} canEditFields={canEditFields} />
      <FormSubmitButton />
    </form>
  );
}

export function EditCriterionModal({
  isOpen,
  onClose,
  criterion,
  onSave,
  otherWeightsSum,
  canEditFields = true,
}: Props) {
  if (!isOpen || !criterion) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="relative max-h-full w-full max-w-sm overflow-y-auto rounded-[22px] bg-white p-6 shadow-2xl">
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
          canEditFields={canEditFields}
          onSave={onSave}
          onClose={onClose}
        />
      </div>
    </div>
  );
}
