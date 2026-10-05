import { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  initialNome: string;
  initialDescricao: string;
  onSave: (data: { nome: string; descricao: string }) => void;
};

type FieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  hasError?: boolean;
};

function FormField({ id, label, value, onChange, hasError }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-brand-900">
        {label}
      </label>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`h-12 w-full rounded-[10px] border px-4 text-sm text-ink ${
          hasError ? 'border-danger' : 'border-black/10'
        }`}
      />
    </div>
  );
}

function EditFormulaInfoForm({
  initialNome,
  initialDescricao,
  onSave,
  onClose,
}: {
  initialNome: string;
  initialDescricao: string;
  onSave: (data: { nome: string; descricao: string }) => void;
  onClose: () => void;
}) {
  const [nome, setNome] = useState(initialNome);
  const [descricao, setDescricao] = useState(initialDescricao);
  const [hasError, setHasError] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim()) return setHasError(true);
    onSave({ nome: nome.trim(), descricao: descricao.trim() });
    onClose();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-2">
      <FormField
        id="edit-title"
        label="Título da Fórmula"
        value={nome}
        onChange={(v) => {
          setNome(v);
          setHasError(false);
        }}
        hasError={hasError}
      />
      <FormField
        id="edit-desc"
        label="Descrição da Fórmula"
        value={descricao}
        onChange={setDescricao}
      />
      <div className="mt-2 flex justify-center">
        <button
          type="submit"
          className="rounded-full bg-brand-900 px-8 py-2.5 text-base font-bold text-white shadow-md hover:bg-brand-800"
        >
          Salvar Edição
        </button>
      </div>
    </form>
  );
}

export function EditFormulaInfoModal({
  isOpen,
  onClose,
  initialNome,
  initialDescricao,
  onSave,
}: Props) {
  if (!isOpen) return null;

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
        <EditFormulaInfoForm
          initialNome={initialNome}
          initialDescricao={initialDescricao}
          onSave={onSave}
          onClose={onClose}
        />
      </div>
    </div>
  );
}
