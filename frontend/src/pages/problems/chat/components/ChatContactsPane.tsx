import { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Alert } from '@/components/ui/Alert';
import { SearchField } from '@/components/ui/SearchField';
import { Spinner } from '@/components/ui/Spinner';
import type { ApiError } from '@/services/apiError';
import { cn } from '@/utils/cn';
import { type ChatContact, type SeenMap, splitContacts } from '@/utils/chat';
import { matchesName } from '@/utils/members';
import { ChatContactSection } from './ChatContactSection';

type ChatContactsPaneProps = {
  contacts: ChatContact[] | null;
  error: ApiError | null;
  isProfessor: boolean;
  selectedId: string | null;
  seen: SeenMap;
  titleId: string;
  className?: string;
  onSelect: (contactId: string) => void;
  onClose: () => void;
};

function ContactsBody({
  contacts,
  error,
  isProfessor,
  selectedId,
  seen,
  onSelect,
}: ChatContactsPaneProps) {
  const [query, setQuery] = useState('');
  if (error)
    return (
      <Alert tone="error" className="mx-4 mt-2">
        {error.message}
      </Alert>
    );
  if (!contacts) {
    return (
      <div className="mt-10 flex justify-center">
        <Spinner className="size-7 text-brand-900" label="Carregando participantes" />
      </div>
    );
  }
  const filtered = contacts.filter((contact) => matchesName(contact.nome, query));
  const { recent, others } = splitContacts(filtered);
  const peopleLabel = isProfessor ? 'Todos os alunos' : 'Professores da turma';
  const section = { selectedId, seen, onSelect, canSeePhotos: isProfessor };
  const emptyLabel = isProfessor
    ? 'Nenhum aluno nesta turma ainda.'
    : 'Nenhum professor encontrado.';

  return (
    <>
      <SearchField
        label={isProfessor ? 'Buscar aluno' : 'Buscar professor'}
        value={query}
        onChange={setQuery}
        className="mx-4 mt-1"
      />
      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-6">
        {filtered.length === 0 && (
          <p className="mt-8 text-center text-sm text-muted">{emptyLabel}</p>
        )}
        <ChatContactSection title="Recentes" contacts={recent} {...section} />
        <ChatContactSection title={peopleLabel} contacts={others} {...section} />
      </div>
    </>
  );
}

export function ChatContactsPane(props: ChatContactsPaneProps) {
  const { isProfessor, titleId, className, onClose } = props;

  return (
    <section
      className={cn(
        'min-h-0 w-full flex-col lg:w-80 lg:shrink-0 lg:border-r lg:border-ink/10',
        className,
      )}
    >
      <div className="flex items-start gap-3 px-6 pt-5 pb-3">
        <div className="min-w-0 flex-1">
          <h2 id={titleId} className="text-xl font-semibold text-ink">
            Conversas
          </h2>
          <p className="text-sm text-muted">
            {isProfessor ? 'Escolha um aluno da turma' : 'Fale com os professores da turma'}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar conversas"
          className="-mr-2 rounded-full p-2 text-muted transition-[background-color,scale] duration-200 hover:bg-black/5 active:scale-90 focus-visible:outline-2 focus-visible:outline-brand-900"
        >
          <XMarkIcon className="size-6" aria-hidden />
        </button>
      </div>
      <ContactsBody {...props} />
    </section>
  );
}
