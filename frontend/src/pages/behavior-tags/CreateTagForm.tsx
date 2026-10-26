import { useState } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { CARD_CLASS } from '@/components/ui/cardStyles';
import { cn } from '@/utils/cn';

function TagFormFields({
  nome,
  onChange,
  onCancel,
  onSubmit,
}: {
  nome: string;
  onChange: (v: string) => void;
  onCancel: () => void;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <form
      onSubmit={onSubmit}
      className={cn(CARD_CLASS, 'flex-col gap-3 p-4 sm:flex-row sm:items-center')}
    >
      <input
        type="text"
        placeholder="Nome da marcação"
        value={nome}
        onChange={(e) => onChange(e.target.value)}
        maxLength={80}
        autoFocus
        className="h-11 flex-1 rounded-xl border border-black/15 bg-surface px-3.5 text-sm text-ink placeholder:text-placeholder focus:border-brand-900 focus:outline-none focus:ring-1 focus:ring-brand-900"
      />
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={!nome.trim()}
          className="h-11 rounded-xl bg-brand-900 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-800 active:scale-95 disabled:opacity-50"
        >
          Salvar
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="h-11 rounded-xl border border-black/15 bg-white px-4 text-sm font-semibold text-muted transition hover:bg-surface hover:text-ink active:scale-95"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

export function CreateTagForm({ onCreate }: { onCreate: (nome: string) => Promise<void> }) {
  const [nome, setNome] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const handleCancel = () => {
    setNome('');
    setIsOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return;
    await onCreate(nome.trim());
    handleCancel();
  };

  if (!isOpen) {
    return (
      <Button variant="outline" onClick={() => setIsOpen(true)} className="w-full">
        <PlusIcon className="size-4" />
        <span>Criar nova marcação</span>
      </Button>
    );
  }

  return (
    <TagFormFields nome={nome} onChange={setNome} onCancel={handleCancel} onSubmit={handleSubmit} />
  );
}
