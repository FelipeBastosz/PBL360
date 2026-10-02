import { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import type { CriterionInput } from '@/types/performanceTable';

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

function parseWeight(raw: string): number {
  const parsed = Number(raw);
  return Number.isNaN(parsed) ? 1 : Math.min(Math.max(parsed, 0), 10);
}

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
        className="rounded-full bg-brand-900 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-brand-800"
      >
        Adicionar
      </button>
    </div>
  );
}

function useAddCriterionForm(
  onAdd: (c: CriterionInput) => void,
  onClose: () => void,
  nextOrder: number,
) {
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [peso, setPeso] = useState('10');
  const [hasError, setHasError] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim()) {
      setHasError(true);
      return;
    }
    onAdd({
      nome: nome.trim(),
      descricao: descricao.trim() || undefined,
      peso: parseWeight(peso),
      ordem: nextOrder,
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
    hasError,
    setHasError,
    handleSubmit,
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
    <form onSubmit={form.handleSubmit} className="flex flex-col gap-3 pt-2">
      <h2 className="text-base font-bold text-brand-900">Novo Critério</h2>
      <CriterionField
        id="criterion-name"
        label="Nome do critério"
        placeholder="Ex: Domínio do tema"
        value={form.nome}
        onChange={(v) => {
          form.setNome(v);
          form.setHasError(false);
        }}
        hasError={form.hasError}
      />
      <CriterionField
        id="criterion-desc"
        label="Descrição (opcional)"
        placeholder="Ex: Demonstra conhecimento"
        value={form.descricao}
        onChange={form.setDescricao}
      />
      <CriterionField
        id="criterion-weight"
        label="Peso (0 a 10)"
        type="number"
        value={form.peso}
        onChange={form.setPeso}
      />
      <ModalActions onClose={onClose} />
    </form>
  );
}

export function AddCriterionModal({ isOpen, onClose, onAdd, nextOrder }: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="relative w-full max-w-sm rounded-[22px] bg-white p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar modal de critério"
          className="absolute right-5 top-5 flex size-7 items-center justify-center rounded-full border border-brand-900 text-brand-900 hover:bg-brand-50"
        >
          <XMarkIcon className="size-4 stroke-[2.5]" />
        </button>
        <AddCriterionForm onAdd={onAdd} onClose={onClose} nextOrder={nextOrder} />
      </div>
    </div>
  );
}
