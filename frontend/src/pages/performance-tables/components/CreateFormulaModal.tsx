import { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { nome: string; descricao: string }) => void;
};

type FieldProps = {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  hasError?: boolean;
};

function FormField({ id, label, placeholder, value, onChange, hasError }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-brand-900">
        {label}
      </label>
      <input
        id={id}
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`h-12 w-full rounded-[10px] border bg-white px-4 text-sm text-ink placeholder:text-placeholder focus:outline-none focus:ring-1 ${
          hasError
            ? 'border-danger focus:border-danger focus:ring-danger'
            : 'border-black/10 focus:border-brand-900 focus:ring-brand-900'
        }`}
      />
    </div>
  );
}

function CreateFormulaForm({
  onSubmit,
}: {
  onSubmit: (data: { nome: string; descricao: string }) => void;
}) {
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [hasError, setHasError] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim()) {
      setHasError(true);
      return;
    }
    onSubmit({ nome: nome.trim(), descricao: descricao.trim() });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-2">
      <FormField
        id="formula-title"
        label="Título da Fórmula"
        placeholder="Fórmula Padrão"
        value={nome}
        onChange={(v) => {
          setNome(v);
          setHasError(false);
        }}
        hasError={hasError}
      />
      <FormField
        id="formula-desc"
        label="Descrição da Fórmula"
        placeholder="Fórmula de Avaliação"
        value={descricao}
        onChange={setDescricao}
      />
      <div className="mt-2 flex justify-center">
        <button
          type="submit"
          className="rounded-full bg-brand-900 px-8 py-2.5 text-base font-bold text-white shadow-md transition-all hover:bg-brand-800 active:scale-95"
        >
          Criar Fórmula
        </button>
      </div>
    </form>
  );
}

export function CreateFormulaModal({ isOpen, onClose, onSubmit }: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="relative w-full max-w-sm rounded-[22px] bg-white p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="absolute right-5 top-5 flex size-7 items-center justify-center rounded-full border border-brand-900 text-brand-900 transition-colors hover:bg-brand-50"
        >
          <XMarkIcon className="size-4 stroke-[2.5]" />
        </button>
        <CreateFormulaForm onSubmit={onSubmit} />
      </div>
    </div>
  );
}
