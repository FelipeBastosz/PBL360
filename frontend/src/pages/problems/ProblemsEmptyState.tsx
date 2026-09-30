import { ClipboardDocumentListIcon } from '@heroicons/react/24/outline';

type ProblemsEmptyStateProps = {
  isProfessor: boolean;
};

export function ProblemsEmptyState({ isProfessor }: ProblemsEmptyStateProps) {
  return (
    <div className="mt-12 flex flex-col items-center justify-center px-6 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-brand-100 text-brand-900">
        <ClipboardDocumentListIcon className="size-8" aria-hidden="true" />
      </div>

      <p className="mt-4 text-base font-semibold text-ink">
        {isProfessor
          ? 'Nenhum problema cadastrado nesta turma.'
          : 'Nenhum problema disponível nesta turma no momento.'}
      </p>

      <p className="mt-1 text-sm text-muted">
        {isProfessor ? (
          <>
            Toque no <span className="font-bold text-brand-900">+</span> para cadastrar o primeiro
            problema.
          </>
        ) : (
          'Aguarde o professor publicar as primeiras atividades.'
        )}
      </p>
    </div>
  );
}
