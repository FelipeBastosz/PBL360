import { useCallback, useEffect, useState } from 'react';
import { PencilSquareIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { AppHeader } from '@/components/layout/AppHeader';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { CARD_CLASS, PAGE_CONTAINER_CLASS } from '@/components/ui/cardStyles';
import { Spinner } from '@/components/ui/Spinner';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { useToast } from '@/hooks/useToast';
import { observationService } from '@/services/observation.service';
import type { BehaviorTag } from '@/types/observation';
import { cn } from '@/utils/cn';

function CreateTagForm({ onCreate }: { onCreate: (nome: string) => Promise<void> }) {
  const [nome, setNome] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim()) return;
    await onCreate(nome.trim());
    setNome('');
    setIsOpen(false);
  }

  if (!isOpen) {
    return (
      <Button variant="outline" onClick={() => setIsOpen(true)} className="w-full">
        <PlusIcon className="size-4" />
        <span>Criar nova marcação</span>
      </Button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(CARD_CLASS, 'flex-col gap-3 p-4 sm:flex-row sm:items-center')}
    >
      <input
        type="text"
        placeholder="Nome da marcação"
        value={nome}
        onChange={(e) => setNome(e.target.value)}
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
          onClick={() => setIsOpen(false)}
          className="h-11 rounded-xl border border-black/15 bg-white px-4 text-sm font-semibold text-muted transition hover:bg-surface hover:text-ink active:scale-95"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

function TagEditRow({
  initialName,
  onSave,
  onCancel,
}: {
  initialName: string;
  onSave: (name: string) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initialName);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (name.trim()) onSave(name.trim());
      }}
      className={cn(CARD_CLASS, 'flex-col gap-3 p-3 sm:flex-row sm:items-center')}
    >
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={80}
        autoFocus
        className="h-10 flex-1 rounded-xl border border-black/15 bg-surface px-3 text-sm text-ink focus:border-brand-900 focus:outline-none"
      />
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={!name.trim()}
          className="h-10 rounded-xl bg-brand-900 px-4 text-sm font-semibold text-white transition hover:bg-brand-800 active:scale-95 disabled:opacity-50"
        >
          Salvar
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="h-10 rounded-xl border border-black/15 bg-white px-3 text-sm font-semibold text-muted transition hover:bg-surface active:scale-95"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

function TagItemRow({
  tag,
  onRename,
  onDelete,
}: {
  tag: BehaviorTag;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const isPredefined = Boolean(tag.predefinida);

  if (isEditing) {
    return (
      <TagEditRow
        initialName={tag.nome}
        onSave={(name) => {
          onRename(tag.id, name);
          setIsEditing(false);
        }}
        onCancel={() => setIsEditing(false)}
      />
    );
  }

  return (
    <div className={cn(CARD_CLASS, 'flex-row items-center justify-between p-4')}>
      <div className="flex items-center gap-3">
        <span className="text-base font-semibold text-brand-900">{tag.nome}</span>
        <span
          className={cn(
            'rounded-full px-2.5 py-0.5 text-xs font-bold',
            isPredefined
              ? 'bg-black/5 text-muted'
              : 'border border-brand-200 bg-brand-50 text-brand-900',
          )}
        >
          {isPredefined ? 'Padrão' : 'Personalizada'}
        </span>
      </div>
      {!isPredefined && (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            aria-label={`Editar marcação ${tag.nome}`}
            className="rounded-lg p-1.5 text-muted transition hover:bg-brand-50 hover:text-brand-900 active:scale-90"
          >
            <PencilSquareIcon className="size-5" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(tag.id)}
            aria-label={`Excluir marcação ${tag.nome}`}
            className="rounded-lg p-1.5 text-muted transition hover:bg-danger-soft hover:text-danger active:scale-90"
          >
            <TrashIcon className="size-5" />
          </button>
        </div>
      )}
    </div>
  );
}

export default function BehaviorTagsPage() {
  const { notify } = useToast();
  const [tags, setTags] = useState<BehaviorTag[]>([]);

  const {
    run: loadTags,
    isLoading,
    error,
  } = useAsyncAction(useCallback(() => observationService.listTags(), []));

  useEffect(() => {
    loadTags().then((res) => res.ok && setTags(res.data));
  }, [loadTags]);

  const handleCreate = async (nome: string) => {
    try {
      const created = await observationService.createTag(nome);
      setTags((prev) => [...prev, created]);
      notify({ tone: 'success', message: 'Marcação criada com sucesso!' });
    } catch {
      notify({ tone: 'error', message: 'Erro ao criar marcação.' });
    }
  };

  const handleRename = async (id: string, nome: string) => {
    try {
      const updated = await observationService.renameTag(id, nome);
      setTags((prev) => prev.map((t) => (t.id === id ? updated : t)));
      notify({ tone: 'success', message: 'Marcação renomeada com sucesso!' });
    } catch {
      notify({ tone: 'error', message: 'Erro ao renomear marcação.' });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await observationService.deleteTag(id);
      setTags((prev) => prev.filter((t) => t.id !== id));
      notify({ tone: 'success', message: 'Marcação removida com sucesso!' });
    } catch {
      notify({ tone: 'error', message: 'Erro ao remover marcação.' });
    }
  };

  return (
    <div className="min-h-dvh bg-surface pb-24">
      <AppHeader />
      <main className={cn(PAGE_CONTAINER_CLASS, 'mt-6 flex flex-col gap-6')}>
        <div>
          <h1 className="text-xl font-bold text-brand-900">Minhas Marcações</h1>
          <p className="text-sm text-muted">
            Gerencie as etiquetas de observação usadas nas sessões.
          </p>
        </div>
        {error && <Alert tone="error">{error.message}</Alert>}
        <CreateTagForm onCreate={handleCreate} />
        {isLoading ? (
          <div className="mt-8 flex justify-center">
            <Spinner className="size-8 text-brand-900" />
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {tags.map((tag) => (
              <TagItemRow key={tag.id} tag={tag} onRename={handleRename} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
