import { FabMenu, type FabAction } from '@/components/ui/FabMenu';
import { ROUTES } from '@/routes/paths';
import { LeaveRoomsFooter } from './LeaveRoomsFooter';

type RoomsFabProps = {
  isLeaveMode: boolean;
  isStudent: boolean;
  onFinishLeave: () => void;
  onStartLeave: () => void;
  onOpenJoin: () => void;
};

export function RoomsFab({
  isLeaveMode,
  isStudent,
  onFinishLeave,
  onStartLeave,
  onOpenJoin,
}: RoomsFabProps) {
  if (isLeaveMode) {
    return <LeaveRoomsFooter onFinish={onFinishLeave} />;
  }

  const actions: FabAction[] = isStudent
    ? [
        { label: 'Entrar em uma turma', onClick: onOpenJoin },
        { label: 'Sair de uma turma', onClick: onStartLeave },
      ]
    : [
        { label: 'Editar uma turma', to: ROUTES.manageRooms },
        { label: 'Criar nova turma', to: ROUTES.createRoom },
        { label: 'Sair de uma turma', onClick: onStartLeave },
      ];

  return <FabMenu label="Ações de turma" actions={actions} />;
}
