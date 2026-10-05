import type { ComponentType, ReactNode, SVGProps } from 'react';
import { Link } from 'react-router-dom';
import { DocumentTextIcon, UserGroupIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import { ROUTES } from '@/routes/paths';
import { INTERACTIVE_CARD_CLASS } from '@/components/ui/cardStyles';
import { cn } from '@/utils/cn';

type RoomTopActionsProps = {
  isProfessor: boolean;
  roomId: string;
  onInvite?: () => void;
};

const ACTION_CLASS = cn(INTERACTIVE_CARD_CLASS, 'flex-row items-center gap-4 p-4 text-left');

function ActionContent({
  Icon,
  title,
  description,
}: {
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  title: string;
  description: ReactNode;
}) {
  return (
    <>
      <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-900 transition-[scale] duration-200 group-hover:scale-105">
        <Icon className="size-6" />
      </div>
      <div>
        <h3 className="text-base font-bold text-ink">{title}</h3>
        <p className="text-xs text-muted">{description}</p>
      </div>
    </>
  );
}

export function RoomTopActions({ isProfessor, roomId, onInvite }: RoomTopActionsProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {isProfessor && (
        <button type="button" onClick={onInvite} className={ACTION_CLASS}>
          <ActionContent Icon={UserPlusIcon} title="Convidar" description="Alunos e professores" />
        </button>
      )}
      {isProfessor && (
        <button type="button" onClick={() => {}} className={ACTION_CLASS}>
          <ActionContent
            Icon={DocumentTextIcon}
            title="Relatório Final"
            description="Notas de todos os problemas"
          />
        </button>
      )}
      <Link to={`${ROUTES.rooms}/${roomId}/participantes`} className={ACTION_CLASS}>
        <ActionContent Icon={UserGroupIcon} title="Turma" description="Participantes da turma" />
      </Link>
    </div>
  );
}
