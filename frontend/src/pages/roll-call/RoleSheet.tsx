import { useState } from 'react';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Sheet } from '@/components/ui/Sheet';
import type { RoleAssignResult } from '@/hooks/useSessionRoles';
import type { RollCallStudent, SessionRole, SessionRoleAssignment } from '@/types/session';
import { roleLabel } from '@/utils/sessionRoles';
import { RoleOptions } from './RoleOptions';
import { StudentAvatar } from './StudentAvatar';

type RoleSheetProps = {
  student: RollCallStudent;
  current: SessionRoleAssignment | null;
  onClose: () => void;
  onConfirm: (
    role: SessionRole | null,
    score: number | null,
    transfer: boolean,
  ) => Promise<RoleAssignResult>;
};

type Transfer = { role: SessionRole; heldBy: string };

function TransferPrompt({
  transfer,
  studentName,
  onKeep,
  onTransfer,
  isBusy,
}: {
  transfer: Transfer;
  studentName: string;
  onKeep: () => void;
  onTransfer: () => void;
  isBusy: boolean;
}) {
  return (
    <div
      role="alertdialog"
      aria-labelledby="transfer-title"
      className="flex flex-col gap-4 animate-fade-in"
    >
      <p id="transfer-title" className="text-ink">
        O papel de <strong>{roleLabel(transfer.role)}</strong> já é de{' '}
        <strong>{transfer.heldBy}</strong>. Transferir para {studentName}?
      </p>
      <div className="flex items-center gap-3">
        <Button variant="outline" onClick={onKeep} className="h-12 flex-1 text-base">
          Manter com {transfer.heldBy.split(' ')[0]}
        </Button>
        <button
          type="button"
          disabled={isBusy}
          onClick={onTransfer}
          className="flex h-12 flex-1 items-center justify-center rounded-xl bg-brand-900 px-4 text-base font-semibold text-white shadow-sm transition-[background-color,scale] duration-200 hover:bg-brand-700 active:scale-[0.98] disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-brand-900"
        >
          Transferir
        </button>
      </div>
    </div>
  );
}

type RoleFormProps = {
  role: SessionRole | null;
  onRoleChange: (role: SessionRole | null) => void;
  error: string | null;
  isBusy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

function RoleForm(props: RoleFormProps) {
  return (
    <div className="flex flex-col gap-4">
      <RoleOptions value={props.role} onChange={props.onRoleChange} />
      {props.error && <Alert tone="error">{props.error}</Alert>}
      <div className="flex items-center gap-3">
        <Button variant="outline" onClick={props.onCancel} className="h-12 flex-1 text-base">
          Cancelar
        </Button>
        <button
          type="button"
          disabled={props.isBusy}
          onClick={props.onConfirm}
          className="flex h-12 flex-1 items-center justify-center rounded-xl bg-brand-900 px-4 text-base font-semibold text-white shadow-sm transition-[background-color,scale] duration-200 hover:bg-brand-700 active:scale-[0.98] disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-brand-900"
        >
          Confirmar
        </button>
      </div>
    </div>
  );
}

function useRoleForm({ current, onConfirm, onClose }: Omit<RoleSheetProps, 'student'>) {
  const [role, setRole] = useState<SessionRole | null>(current?.papel ?? null);
  const [transfer, setTransfer] = useState<Transfer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  async function executeAssign(targetRole: SessionRole | null, shouldTransfer: boolean) {
    setIsBusy(true);
    setError(null);
    const result = await onConfirm(targetRole, null, shouldTransfer);
    setIsBusy(false);
    if (result.ok) {
      onClose();
      return;
    }
    if (result.heldBy && targetRole) {
      setTransfer({ role: targetRole, heldBy: result.heldBy });
      return;
    }
    setError(result.message);
  }

  return {
    role,
    setRole,
    transfer,
    setTransfer,
    error,
    isBusy,
    confirm: () => void executeAssign(role, false),
    confirmTransfer: () => void executeAssign(transfer?.role ?? role, true),
  };
}

export function RoleSheet({ student, current, onClose, onConfirm }: RoleSheetProps) {
  const form = useRoleForm({ current, onClose, onConfirm });

  return (
    <Sheet
      isOpen
      placement="center"
      title={student.nome}
      leading={<StudentAvatar student={student} className="size-10 text-sm" />}
      onClose={onClose}
    >
      {form.transfer ? (
        <TransferPrompt
          transfer={form.transfer}
          studentName={student.nome}
          onKeep={() => form.setTransfer(null)}
          onTransfer={form.confirmTransfer}
          isBusy={form.isBusy}
        />
      ) : (
        <RoleForm
          role={form.role}
          onRoleChange={form.setRole}
          error={form.error}
          isBusy={form.isBusy}
          onCancel={onClose}
          onConfirm={form.confirm}
        />
      )}
    </Sheet>
  );
}
