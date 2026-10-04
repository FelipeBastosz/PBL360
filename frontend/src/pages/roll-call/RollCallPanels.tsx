import type { useSessionRoles } from '@/hooks/useSessionRoles';
import type { useTableInteractions } from '@/hooks/useTableInteractions';
import { useToast } from '@/hooks/useToast';
import type { AttendanceStatus, SessionRole } from '@/types/session';
import { setStudentStatus, unseatStudent, type RollCallBoard } from '@/utils/rollCallBoard';
import { PresenceSheet } from './PresenceSheet';
import { RoleSheet } from './RoleSheet';

type RollCallPanelsProps = {
  board: RollCallBoard;
  change: (update: (board: RollCallBoard) => RollCallBoard) => void;
  table: ReturnType<typeof useTableInteractions>;
  roles: ReturnType<typeof useSessionRoles>;
};

export function RollCallPanels({ board, change, table, roles }: RollCallPanelsProps) {
  const { notify } = useToast();
  const find = (id: string | null) =>
    board.students.find((student) => student.alunoId === id) ?? null;
  const panelStudent = find(table.panelId);
  const roleStudent = find(table.roleId);

  function setStatus(status: AttendanceStatus, justificativa?: string) {
    if (!panelStudent) return;
    change((current) => setStudentStatus(current, panelStudent.alunoId, status, justificativa));
    if (status === 'JUSTIFICADO' || status === 'AUSENTE') table.closePanel();
  }

  async function assignRole(role: SessionRole | null, score: number | null, transfer: boolean) {
    const result = await roles.assign({ studentId: roleStudent!.alunoId, role, score, transfer });
    if (result.ok)
      notify({ tone: 'success', message: role ? 'Papel atribuído.' : 'Papel removido.' });
    return result;
  }

  return (
    <>
      <PresenceSheet
        key={panelStudent?.alunoId ?? 'none'}
        student={panelStudent}
        onClose={table.closePanel}
        onStatus={setStatus}
        onUnseat={() => {
          change((current) => unseatStudent(current, panelStudent!.alunoId));
          table.closePanel();
        }}
        onAssignRole={table.openRole}
      />
      {roleStudent && (
        <RoleSheet
          key={roleStudent.alunoId}
          student={roleStudent}
          current={roles.roleOf(roleStudent.alunoId)}
          onClose={table.closeRole}
          onConfirm={assignRole}
        />
      )}
    </>
  );
}
