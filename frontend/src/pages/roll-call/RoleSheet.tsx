import { useId, useState } from 'react';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Sheet } from '@/components/ui/Sheet';
import { fieldControlClassName } from '@/components/ui/fieldStyles';
import type { RoleAssignResult } from '@/hooks/useSessionRoles';
import type { RollCallStudent, SessionRole, SessionRoleAssignment } from '@/types/session';
import { formatRoleScore, parseRoleScore, roleLabel } from '@/utils/sessionRoles';
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

type Transfer = { role: SessionRole; heldBy: string; score: number | null };

function ScoreField({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm text-muted">
        Nota adicional pelo papel (opcional)
      </label>
      <input
        id={id}
        inputMode="decimal"
        placeholder="0,0 a 1,0"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className={fieldControlClassName(false)}
      />
    </div>
  );
}

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
      <div className="flex gap-3">
        <Button variant="outline" onClick={onKeep} className="flex-1">
          Manter com {transfer.heldBy.split(' ')[0]}
        </Button>
        <Button onClick={onTransfer} isLoading={isBusy} className="h-12 flex-1 text-base">
          Transferir
        </Button>
      </div>
    </div>
  );
}

type RoleFormProps = {
  role: SessionRole | null;
  onRoleChange: (role: SessionRole | null) => void;
  scoreText: string;
  onScoreChange: (value: string) => void;
  error: string | null;
  isBusy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

function RoleForm(props: RoleFormProps) {
  return (
    <div className="flex flex-col gap-4">
      <RoleOptions value={props.role} onChange={props.onRoleChange} />
      <ScoreField
        value={props.scoreText}
        onChange={props.onScoreChange}
        disabled={props.role === null}
      />
      {props.error && <Alert tone="error">{props.error}</Alert>}
      <div className="flex gap-3">
        <Button variant="outline" onClick={props.onCancel} className="flex-1">
          Cancelar
        </Button>
        <Button
          onClick={props.onConfirm}
          isLoading={props.isBusy}
          className="h-12 flex-1 text-base"
        >
          Confirmar
        </Button>
      </div>
    </div>
  );
}

function useRoleForm({ current, onConfirm, onClose }: Omit<RoleSheetProps, 'student'>) {
  const [role, setRole] = useState<SessionRole | null>(current?.papel ?? null);
  const [scoreText, setScoreText] = useState(formatRoleScore(current?.notaAdicional ?? null));
  const [transfer, setTransfer] = useState<Transfer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  async function submit(score: number | null, shouldTransfer: boolean) {
    setIsBusy(true);
    const result = await onConfirm(role, score, shouldTransfer);
    setIsBusy(false);
    if (result.ok) return onClose();
    if (result.heldBy && role) return setTransfer({ role, heldBy: result.heldBy, score });
    setError(result.message);
  }

  function confirm() {
    const score = parseRoleScore(scoreText);
    if (score === undefined) return setError('Informe uma nota entre 0,0 e 1,0.');
    setError(null);
    void submit(role ? score : null, false);
  }

  return {
    role,
    setRole,
    scoreText,
    setScoreText,
    transfer,
    setTransfer,
    error,
    isBusy,
    submit,
    confirm,
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
          onTransfer={() => void form.submit(form.transfer?.score ?? null, true)}
          isBusy={form.isBusy}
        />
      ) : (
        <RoleForm
          role={form.role}
          onRoleChange={form.setRole}
          scoreText={form.scoreText}
          onScoreChange={form.setScoreText}
          error={form.error}
          isBusy={form.isBusy}
          onCancel={onClose}
          onConfirm={form.confirm}
        />
      )}
    </Sheet>
  );
}
