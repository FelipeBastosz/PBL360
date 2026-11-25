import { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import type { CriterionInput } from '@/types/performanceTable';
import {
  formatCriterionWeight,
  parseCriterionWeight,
  validateCriterion,
} from '@/utils/criterionWeight';
import { useCriterionWeightInput } from '../hooks/useCriterionWeightInput';
import { CriterionWeightField } from './CriterionWeightField';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  criterion: CriterionInput | null;
  onSave: (updated: CriterionInput) => void;
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
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const weightInput = useCriterionWeightInput(formatCriterionWeight(criterion.peso), () =>
    setErrorMsg(null),
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const error = validateCriterion(nome, weightInput.peso);
    if (error) return setErrorMsg(error);

    const weight = parseCriterionWeight(weightInput.peso)!;
    onSave({
      ...criterion,
      nome: nome.trim(),
      descricao: descricao.trim() || undefined,
      peso: weight,
    });
    onClose();
  }

  return {
    nome,
    setNome,
    descricao,
    setDescricao,
    errorMsg,
    setErrorMsg,
    handleSubmit,
    ...weightInput,
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
          canEditFields={canEditFields}
          onSave={onSave}
          onClose={onClose}
        />
      </div>
    </div>
  );
}
