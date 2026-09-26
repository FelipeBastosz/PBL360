import { useState } from 'react';
import { MagnifyingGlassIcon, PlusIcon } from '@heroicons/react/24/outline';
import { BrandHeader } from '@/components/layout/BrandHeader';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/utils/cn';

function getInitials(name?: string) {
  if (!name) return 'U';
  const parts = name.split(' ').filter(Boolean);
  return parts
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');
}

function RoomsHeader() {
  const { user } = useAuth();

  return (
    <header className="flex h-16 shrink-0 items-center justify-between bg-brand-900 px-4">
      <div className="text-white">
        <BrandHeader />
      </div>
      <div className="flex size-9 items-center justify-center rounded-full bg-brand-200 text-sm font-semibold text-brand-900">
        {getInitials(user?.nome)}
      </div>
    </header>
  );
}

function RoomsSearch() {
  const [query, setQuery] = useState('');

  return (
    <div className="relative mt-4 px-4">
      <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center pl-3">
        <MagnifyingGlassIcon className="size-5 text-placeholder" aria-hidden />
      </div>
      <input
        type="text"
        placeholder="Pesquisar turma"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="h-12 w-full rounded-[10px] border border-black/10 bg-white pl-10 pr-4 text-ink placeholder:text-placeholder focus:border-brand-900 focus:outline-none focus:ring-1 focus:ring-brand-900"
      />
    </div>
  );
}

type RoomsEmptyStateProps = {
  isStudent: boolean;
};

function RoomsEmptyState({ isStudent }: RoomsEmptyStateProps) {
  return (
    <div className="mt-20 flex flex-col items-center justify-center px-6 text-center">
      <p className="text-base font-semibold text-ink">
        {isStudent
          ? 'Você ainda não faz parte de nenhuma turma.'
          : 'Você ainda não possui turmas cadastradas.'}
      </p>
      <p className="mt-1 text-sm text-muted">
        Toque no <span className="font-bold text-brand-900">+</span> para começar.
      </p>
    </div>
  );
}

type RoomsFabMenuProps = {
  isStudent: boolean;
};

function RoomsFabMenu({ isStudent }: RoomsFabMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 flex flex-col items-end gap-3">
      {isOpen && (
        <div className="flex animate-fade-up flex-col items-end gap-2">
          {isStudent ? (
            <button className="rounded-full border border-brand-900 bg-white px-5 py-2 text-sm font-semibold text-brand-900 shadow-sm hover:bg-brand-50">
              Entrar em uma turma
            </button>
          ) : (
            <>
              <button className="rounded-full border border-brand-900 bg-white px-5 py-2 text-sm font-semibold text-brand-900 shadow-sm hover:bg-brand-50">
                Editar uma turma
              </button>
              <button className="rounded-full border border-brand-900 bg-white px-5 py-2 text-sm font-semibold text-brand-900 shadow-sm hover:bg-brand-50">
                Criar nova turma
              </button>
            </>
          )}
        </div>
      )}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex size-14 items-center justify-center rounded-full bg-brand-900 text-white shadow-lg transition-transform',
          isOpen ? 'rotate-45 bg-danger' : '',
        )}
        aria-label="Ações de turma"
      >
        <PlusIcon className="size-6" strokeWidth={2.5} />
      </button>
    </div>
  );
}

export default function RoomsPage() {
  const { user } = useAuth();
  const [rooms] = useState<unknown[]>([]);
  const isStudent = user?.tipo === 'ALUNO';

  return (
    <div className="min-h-dvh bg-surface pb-24">
      <RoomsHeader />
      <RoomsSearch />

      <main className="mt-6 px-4">
        <h2 className="text-xs font-bold uppercase tracking-widest text-muted">
          Minhas turmas · {rooms.length}
        </h2>

        {rooms.length === 0 ? (
          <RoomsEmptyState isStudent={isStudent} />
        ) : (
          <div className="mt-4 flex flex-col gap-3">{/* Listagem de turmas */}</div>
        )}
      </main>

      <RoomsFabMenu isStudent={isStudent} />
    </div>
  );
}
