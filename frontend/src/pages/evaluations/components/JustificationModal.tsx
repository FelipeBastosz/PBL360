import { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';

type Props = {
  isOpen: boolean;
  isLoading: boolean;
  onConfirm: (justificativa: string) => void;
  onCancel: () => void;
};

function JustificationForm({
  isLoading,
  onConfirm,
  onCancel,
}: {
  isLoading: boolean;
  onConfirm: (val: string) => void;
  onCancel: () => void;
}) {
  const [justificativa, setJustificativa] = useState('');
  const [error, setError] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (justificativa.trim().length < 10) {
      setError(true);
      return;
    }
    onConfirm(justificativa.trim());
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <h2 className="text-base font-bold text-brand-900">Justificativa da alteração</h2>
      <p className="text-xs leading-relaxed text-muted">
        Esta avaliação já havia sido enviada. Informe uma justificativa (mínimo de 10 caracteres)
        para registrar o ajuste.
      </p>
      <textarea
        rows={3}
        value={justificativa}
        onChange={(e) => {
          setJustificativa(e.target.value);
          setError(false);
        }}
        placeholder="Motivo da alteração das notas..."
        className={`w-full rounded-xl border p-3 text-xs text-ink placeholder:text-placeholder focus:outline-none focus:ring-1 ${
          error ? 'border-danger' : 'border-black/10 focus:border-brand-900 focus:ring-brand-900'
        }`}
      />
      {error && <span className="text-xs text-danger">Mínimo de 10 caracteres.</span>}
      <div className="mt-2 flex flex-col gap-2">
        <Button type="submit" isLoading={isLoading}>
          Confirmar e Enviar
        </Button>
        <Button type="button" variant="link" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

export function JustificationModal({ isOpen, isLoading, onConfirm, onCancel }: Props) {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
    >
      <div className="relative w-full max-w-sm rounded-[24px] bg-white p-6 shadow-2xl">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          aria-label="Fechar"
          className="absolute right-4 top-4 rounded-full p-1 text-ink/60 hover:text-ink"
        >
          <XMarkIcon className="size-6" />
        </button>
        <JustificationForm isLoading={isLoading} onConfirm={onConfirm} onCancel={onCancel} />
      </div>
    </div>
  );
}
