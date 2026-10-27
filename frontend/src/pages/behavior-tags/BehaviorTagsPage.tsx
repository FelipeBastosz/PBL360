import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';
import { UserMenuButton } from '@/components/layout/UserMenu';
import { Alert } from '@/components/ui/Alert';
import { PAGE_CONTAINER_CLASS } from '@/components/ui/cardStyles';
import { SearchField } from '@/components/ui/SearchField';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { toApiError } from '@/services/apiError';
import { observationService } from '@/services/observation.service';
import type { BehaviorTag } from '@/types/observation';
import type { UserResponse } from '@/types/auth';
import { cn } from '@/utils/cn';
import { CreateTagForm } from './CreateTagForm';
import { DeleteTagModal } from './DeleteTagModal';
import { TagsList } from './TagsList';

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

function useTagActions(
  setTags: React.Dispatch<React.SetStateAction<BehaviorTag[]>>,
  tagToDelete: BehaviorTag | null,
  setTagToDelete: (tag: BehaviorTag | null) => void,
) {
  const { notify } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleCreate = async (nome: string) => {
    try {
      const created = await observationService.createTag(nome);
      setTags((prev) => [...prev, created]);
      notify({ tone: 'success', message: 'Marcação criada com sucesso!' });
    } catch (err: unknown) {
      notify({ tone: 'error', message: toApiError(err).message });
    }
  };

  const handleRename = async (id: string, nome: string) => {
    try {
      const updated = await observationService.renameTag(id, nome);
      setTags((prev) => prev.map((t) => (t.id === id ? updated : t)));
      notify({ tone: 'success', message: 'Marcação renomeada com sucesso!' });
    } catch (err: unknown) {
      notify({ tone: 'error', message: toApiError(err).message });
    }
  };

  const handleConfirmDelete = async () => {
    if (!tagToDelete) return;
    const targetId = tagToDelete.id;
    setIsDeleting(true);
    try {
      await observationService.deleteTag(targetId);
      setTags((prev) => prev.filter((t) => t.id !== targetId));
      setTagToDelete(null);
      notify({ tone: 'success', message: 'Marcação removida com sucesso!' });
    } catch (err: unknown) {
      notify({ tone: 'error', message: toApiError(err).message });
    } finally {
      setIsDeleting(false);
    }
  };

  return { isDeleting, handleCreate, handleRename, handleConfirmDelete };
}

function useBehaviorTags() {
  const [tags, setTags] = useState<BehaviorTag[]>([]);
  const [query, setQuery] = useState('');
  const [tagToDelete, setTagToDelete] = useState<BehaviorTag | null>(null);

  const {
    run: loadTags,
    isLoading,
    error,
  } = useAsyncAction(useCallback(() => observationService.listTags(), []));

  useEffect(() => {
    loadTags().then((res) => res.ok && setTags(res.data));
  }, [loadTags]);

  const actions = useTagActions(setTags, tagToDelete, setTagToDelete);

  const filteredTags = tags
    .filter((t) => !t.predefinida)
    .filter((t) => t.nome.toLowerCase().includes(query.toLowerCase()));

  return {
    query,
    setQuery,
    filteredTags,
    isLoading,
    error,
    tagToDelete,
    setTagToDelete,
    ...actions,
  };
}

export default function BehaviorTagsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const state = useBehaviorTags();

  return (
    <div className="min-h-dvh bg-surface pb-24">
      <BehaviorTagsHeader user={user} onBack={() => navigate(-1)} />
      <main className={cn(PAGE_CONTAINER_CLASS, 'mt-6 flex flex-col gap-4')}>
        {state.error && <Alert tone="error">{state.error.message}</Alert>}
        <CreateTagForm onCreate={state.handleCreate} />
        <SearchField label="Pesquisar marcação" value={state.query} onChange={state.setQuery} />
        <TagsList
          tags={state.filteredTags}
          query={state.query}
          isLoading={state.isLoading}
          onRename={state.handleRename}
          onDeleteRequest={state.setTagToDelete}
        />
      </main>
      <DeleteTagModal
        tagName={state.tagToDelete?.nome ?? ''}
        isOpen={Boolean(state.tagToDelete)}
        isLoading={state.isDeleting}
        onConfirm={state.handleConfirmDelete}
        onCancel={() => state.setTagToDelete(null)}
      />
    </div>
  );
}
