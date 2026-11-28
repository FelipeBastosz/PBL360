import { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import type { CriterionInput } from '@/types/performanceTable';
import { parseCriterionWeight, validateCriterion } from '@/utils/criterionWeight';
import { useCriterionWeightInput } from '../hooks/useCriterionWeightInput';
import { CriterionWeightField } from './CriterionWeightField';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (criterion: CriterionInput) => void;
  nextOrder: number;
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
      <label htmlFor={id} className="text-xs font-semibold text-brand-accent">
        {label}
      </label>
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`h-10 w-full rounded-[10px] border px-3 text-sm text-ink ${
          hasError ? 'border-danger' : 'border-border'
        }`}
      />
    </div>
  );
}

function ModalActions({ onClose }: { onClose: () => void }) {
  return (
    <div className="mt-3 flex justify-end gap-2">
      <button
        type="button"
        onClick={onClose}
        className="px-4 py-2 text-xs font-semibold text-muted hover:text-ink"
      >
        Cancelar
      </button>
      <button
        type="submit"
        className="rounded-full bg-brand-primary px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-brand-primary-hover"
      >
        Adicionar
      </button>
    </div>
  );
}

function FormHeader({ errorMsg }: { errorMsg: string | null }) {
  return (
    <>
      <h2 className="text-base font-bold text-brand-accent">Novo Critério</h2>
      {errorMsg && <p className="text-xs font-semibold text-danger">{errorMsg}</p>}
    </>
  );
}

function buildAddedCriterion(
  nome: string,
  descricao: string,
  weight: number,
  nextOrder: number,
): CriterionInput {
  return {
    nome: nome.trim(),
    descricao: descricao.trim() || undefined,
    peso: weight,
    ordem: nextOrder,
  };
}

function useAddCriterionForm(
  onAdd: (c: CriterionInput) => void,
  onClose: () => void,
  nextOrder: number,
) {
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const weightInput = useCriterionWeightInput('1', () => setErrorMsg(null));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const error = validateCriterion(nome, weightInput.peso);
    if (error) return setErrorMsg(error);
    const weight = parseCriterionWeight(weightInput.peso)!;
    onAdd(buildAddedCriterion(nome, descricao, weight, nextOrder));
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

function AddCriterionForm({
  onAdd,
  onClose,
  nextOrder,
}: {
  onAdd: (criterion: CriterionInput) => void;
  onClose: () => void;
  nextOrder: number;
}) {
  const form = useAddCriterionForm(onAdd, onClose, nextOrder);

  return (
    <form noValidate onSubmit={form.handleSubmit} className="flex flex-col gap-3 pt-2">
      <FormHeader errorMsg={form.errorMsg} />
      <CriterionField
        id="criterion-name"
        label="Nome do critério"
        placeholder="Ex: Domínio do tema"
        value={form.nome}
        onChange={(v) => {
          form.setNome(v);
          form.setErrorMsg(null);
        }}
        hasError={Boolean(form.errorMsg)}
      />
      <CriterionField
        id="criterion-desc"
        label="Descrição (opcional)"
        placeholder="Ex: Demonstra conhecimento"
        value={form.descricao}
        onChange={form.setDescricao}
      />
      <CriterionWeightField
        id="criterion-weight"
        label="Peso (0 a 10)"
        value={form.peso}
        onChange={form.handleWeightChange}
        onStep={form.handleWeightStep}
        onKeyDown={form.handleWeightKeyDown}
        hasError={Boolean(form.errorMsg)}
      />
      <ModalActions onClose={onClose} />
    </form>
  );
}

export function AddCriterionModal({ isOpen, onClose, onAdd, nextOrder }: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="relative max-h-full w-full max-w-sm overflow-y-auto rounded-[22px] bg-elevated p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar modal de critério"
          className="absolute right-5 top-5 flex size-7 items-center justify-center rounded-full border border-brand-accent text-brand-accent hover:bg-brand-soft"
        >
          <XMarkIcon className="size-4 stroke-[2.5]" />
        </button>
        <AddCriterionForm onAdd={onAdd} onClose={onClose} nextOrder={nextOrder} />
      </div>
    </div>
  );
}
