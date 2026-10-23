import { useState } from 'react';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { CARD_CLASS } from '@/components/ui/cardStyles';
import { Spinner } from '@/components/ui/Spinner';
import type { BehaviorTag } from '@/types/observation';
import { cn } from '@/utils/cn';

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
  onDeleteRequest,
}: {
  tag: BehaviorTag;
  onRename: (id: string, name: string) => void;
  onDeleteRequest: (tag: BehaviorTag) => void;
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
          onClick={() => onDeleteRequest(tag)}
          aria-label={`Excluir marcação ${tag.nome}`}
          className="rounded-lg p-1.5 text-danger transition hover:bg-danger-soft active:scale-90"
        >
          <TrashIcon className="size-5" />
        </button>
      </div>
    </div>
  );
}

export function TagsList({
  tags,
  query,
  isLoading,
  onRename,
  onDeleteRequest,
}: {
  tags: BehaviorTag[];
  query: string;
  isLoading: boolean;
  onRename: (id: string, name: string) => void;
  onDeleteRequest: (tag: BehaviorTag) => void;
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
        <TagItemRow key={tag.id} tag={tag} onRename={onRename} onDeleteRequest={onDeleteRequest} />
      ))}
    </div>
  );
}
