import { ClipboardDocumentListIcon, UserGroupIcon } from '@heroicons/react/24/outline';

type EmptyStateType = 'no-students' | 'no-problems';

type ClassReportEmptyStateProps = {
  type: EmptyStateType;
};

const CONFIG: Record<
  EmptyStateType,
  { title: string; subtitle: string; Icon: typeof UserGroupIcon }
> = {
  'no-students': {
    title: 'Não há alunos vinculados a esta turma.',
    subtitle: 'Assim que novos alunos entrarem na turma, as notas consolidadas aparecerão aqui.',
    Icon: UserGroupIcon,
  },
  'no-problems': {
    title: 'Nenhum problema registrado nesta turma.',
    subtitle: 'Cadastre problemas na turma para começar a avaliar as sessões dos alunos.',
    Icon: ClipboardDocumentListIcon,
  },
};

export function ClassReportEmptyState({ type }: ClassReportEmptyStateProps) {
  const { title, subtitle, Icon } = CONFIG[type];

  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-black/5 bg-white p-12 text-center shadow-sm">
      <div className="flex size-16 items-center justify-center rounded-full bg-brand-50 text-brand-900">
        <Icon className="size-8" aria-hidden="true" />
      </div>
      <h2 className="mt-4 text-base font-semibold text-ink">{title}</h2>
      <p className="mt-1 max-w-sm text-sm text-muted">{subtitle}</p>
    </div>
  );
}
