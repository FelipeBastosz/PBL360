import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeftIcon, PencilIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { UserMenuButton } from '@/components/layout/UserMenu';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { CARD_CLASS, PAGE_CONTAINER_CLASS } from '@/components/ui/cardStyles';
import { SearchField } from '@/components/ui/SearchField';
import { Spinner } from '@/components/ui/Spinner';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { observationService } from '@/services/observation.service';
import type { BehaviorTag } from '@/types/observation';
import type { UserResponse } from '@/types/auth';
import { cn } from '@/utils/cn';

function BehaviorTagsHeader({
  user,
  onBack,
}: {
  user: Pick<UserResponse, 'id' | 'nome' | 'possuiFoto'> | null;
  onBack: () => void;
}) {
  return (
    <header className="sticky top-0 z-10 shrink-0 bg-brand-900 text-white shadow-[0_6px_18px_-12px_rgb(0_0_119/0.8)]">
      <div className={cn(PAGE_CONTAINER_CLASS, 'flex h-16 items-center justify-between')}>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            aria-label="Voltar"
            className="-ml-1 rounded-full p-2 transition-[background-color,scale] duration-200 hover:bg-white/10 active:scale-90 focus-visible:outline-2 focus-visible:outline-white"
          >
            <ChevronLeftIcon className="size-6" />
          </button>
          <div className="flex flex-col">
            <h1 className="text-base font-semibold leading-tight">Minhas Marcações</h1>
            <span className="text-xs text-white/70">Etiquetas personalizadas</span>
          </div>
        </div>
        <UserMenuButton user={user} className="ring-2 ring-white/20" />
      </div>
    </header>
  );
}

function CreateTagForm({ onCreate }: { onCreate: (nome: string) => Promise<void> }) {
  const [nome, setNome] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  function handleCancel() {
    setNome('');
    setIsOpen(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim()) return;
    await onCreate(nome.trim());
    handleCancel();
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
          onClick={handleCancel}
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
      <span className="text-base font-semibold text-brand-900">{tag.nome}</span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          aria-label={`Editar marcação ${tag.nome}`}
          className="rounded-lg p-1.5 text-brand-900 transition hover:bg-brand-50 active:scale-90"
        >
          <PencilIcon className="size-5" />
        </button>
        <button
          type="button"
          onClick={() => onDelete(tag.id)}
          aria-label={`Excluir marcação ${tag.nome}`}
          className="rounded-lg p-1.5 text-danger transition hover:bg-danger-soft active:scale-90"
        >
          <TrashIcon className="size-5" />
        </button>
      </div>
    </div>
  );
}

function TagsList({
  tags,
  query,
  isLoading,
  onRename,
  onDelete,
}: {
  tags: BehaviorTag[];
  query: string;
  isLoading: boolean;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}) {
  if (isLoading) {
    return (
      <div className="mt-8 flex justify-center">
        <Spinner className="size-8 text-brand-900" />
      </div>
    );
  }
  if (tags.length === 0) {
    return (
      <p className="mt-4 text-center text-sm text-muted">
        {query ? 'Nenhuma marcação encontrada.' : 'Você ainda não possui marcações personalizadas.'}
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      {tags.map((tag) => (
        <TagItemRow key={tag.id} tag={tag} onRename={onRename} onDelete={onDelete} />
      ))}
    </div>
  );
}

export default function BehaviorTagsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { notify } = useToast();
  const [tags, setTags] = useState<BehaviorTag[]>([]);
  const [query, setQuery] = useState('');

  const { run: loadTags, isLoading, error } = useAsyncAction(
    useCallback(() => observationService.listTags(), []),
  );

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

  const filteredTags = tags
    .filter((t) => !t.predefinida)
    .filter((t) => t.nome.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="min-h-dvh bg-surface pb-24">
      <BehaviorTagsHeader user={user} onBack={() => navigate(-1)} />
      <main className={cn(PAGE_CONTAINER_CLASS, 'mt-6 flex flex-col gap-4')}>
        {error && <Alert tone="error">{error.message}</Alert>}
        <CreateTagForm onCreate={handleCreate} />
        <SearchField label="Pesquisar marcação" value={query} onChange={setQuery} />
        <TagsList
          tags={filteredTags}
          query={query}
          isLoading={isLoading}
          onRename={handleRename}
          onDelete={handleDelete}
        />
      </main>
    </div>
  );
}