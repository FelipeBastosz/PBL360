import { useContext } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';
import { UserMenuButton } from '@/components/layout/UserMenu';
import { AuthContext } from '@/contexts/authContext';
import { ROUTES } from '@/routes/paths';
import type { ClassReportRoom } from '@/types/class-report';
import type { UserResponse } from '@/types/auth';
import { PAGE_CONTAINER_CLASS } from '@/components/ui/cardStyles';
import { cn } from '@/utils/cn';

export type ClassReportHeaderProps = {
  sala?: ClassReportRoom | null;
  roomId?: string;
  user?: Pick<UserResponse, 'id' | 'nome' | 'possuiFoto'> | null;
};

export function ClassReportHeader({ sala, roomId, user: propUser }: ClassReportHeaderProps) {
  const authUser = useContext(AuthContext)?.user ?? null;
  const user = propUser !== undefined ? propUser : authUser;
  const backTo = roomId ? `${ROUTES.rooms}/${roomId}/problemas` : ROUTES.rooms;
  const subtitle = sala
    ? `${sala.nome}${sala.semestre ? ` • ${sala.semestre}` : ''}`
    : 'Desempenho dos alunos no semestre';

  return (
    <header className="sticky top-0 z-30 bg-brand-900 text-white shadow-[0_6px_18px_-12px_rgb(0_0_119/0.8)]">
      <div className={cn(PAGE_CONTAINER_CLASS, 'flex h-16 items-center justify-between')}>
        <div className="flex items-center gap-3">
          <Link
            to={backTo}
            aria-label="Voltar para os problemas da turma"
            className="-ml-1 rounded-full p-2 transition-[background-color,scale] duration-200 hover:bg-white/10 active:scale-90 focus-visible:outline-2 focus-visible:outline-white"
          >
            <ChevronLeftIcon className="size-6" aria-hidden="true" />
          </Link>
          <div className="flex flex-col animate-slide-down">
            <h1 className="text-base font-semibold leading-tight sm:text-lg">
              Relatório Final da Turma
            </h1>
            <span className="text-xs text-white/70">{subtitle}</span>
          </div>
        </div>
        <UserMenuButton user={user} className="animate-pop-in ring-2 ring-white/20" />
      </div>
    </header>
  );
}
