import { useState } from 'react';
import { UserPlusIcon } from '@heroicons/react/24/outline';
import { SearchField } from '@/components/ui/SearchField';
import { Spinner } from '@/components/ui/Spinner';
import type { TutorSummary } from '@/types/room';
import { MIN_SEARCH_LENGTH, useTutorSearch } from './useTutorSearch';

type TutorSearchProps = {
  existingIds: string[];
  pendingId: string | null;
  onAdd: (tutor: TutorSummary) => Promise<boolean>;
};

function SearchStatus({ text }: { text: string }) {
  return <p className="py-3 text-center text-sm text-muted animate-fade-in">{text}</p>;
}

function ResultRow({
  tutor,
  isPending,
  onAdd,
}: {
  tutor: TutorSummary;
  isPending: boolean;
  onAdd: (t: TutorSummary) => void;
}) {
  return (
    <li className="flex items-center gap-3 py-2.5 animate-fade-up [animation-duration:240ms]">
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-ink">{tutor.nome}</p>
        <p className="truncate text-sm text-muted">{tutor.email}</p>
      </div>
      <button
        type="button"
        onClick={() => onAdd(tutor)}
        disabled={isPending}
        aria-label={`Adicionar ${tutor.nome}`}
        className="flex items-center gap-1.5 rounded-xl bg-brand-900 px-3 py-2 text-sm font-semibold text-white transition-[background-color,scale] duration-200 hover:bg-brand-700 active:scale-95 disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-900"
      >
        {isPending ? (
          <Spinner className="size-4" />
        ) : (
          <UserPlusIcon className="size-4" aria-hidden />
        )}
        Adicionar
      </button>
    </li>
  );
}

function SearchResults({
  query,
  existingIds,
  pendingId,
  onAdd,
}: TutorSearchProps & { query: string }) {
  const { isSearchable, isSearching, tutors, failed } = useTutorSearch(query);
  const available = tutors.filter((tutor) => !existingIds.includes(tutor.id));

  if (!query.trim()) return null;
  if (!isSearchable) return <SearchStatus text={`Digite ao menos ${MIN_SEARCH_LENGTH} letras.`} />;
  if (isSearching)
    return (
      <div className="flex justify-center py-3">
        <Spinner className="size-5 text-brand-900" />
      </div>
    );
  if (failed) return <SearchStatus text="Não foi possível buscar professores agora." />;
  if (!available.length) return <SearchStatus text="Nenhum professor encontrado para convidar." />;

  return (
    <ul className="divide-y divide-black/5">
      {available.map((tutor) => (
        <ResultRow key={tutor.id} tutor={tutor} isPending={pendingId === tutor.id} onAdd={onAdd} />
      ))}
    </ul>
  );
}

export function TutorSearch({ onAdd, ...props }: TutorSearchProps) {
  const [query, setQuery] = useState('');

  async function handleAdd(tutor: TutorSummary): Promise<boolean> {
    const added = await onAdd(tutor);
    if (added) setQuery('');
    return added;
  }

  return (
    <section className="flex flex-col gap-2">
      <SearchField label="Buscar professor por nome ou e-mail" value={query} onChange={setQuery} />
      <SearchResults query={query} onAdd={handleAdd} {...props} />
    </section>
  );
}
