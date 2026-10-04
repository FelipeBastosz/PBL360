import { useState } from 'react';
import { CheckIcon, ClockIcon, LockClosedIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Sheet } from '@/components/ui/Sheet';
import type { AttendanceStatus, RollCallStudent } from '@/types/session';
import { cn } from '@/utils/cn';
import { STATUS_LABEL } from './attendanceLabels';
import { JustificationForm } from './JustificationForm';
import { StudentAvatar } from './StudentAvatar';

type PresenceSheetProps = {
  student: RollCallStudent | null;
  onClose: () => void;
  onStatus: (status: AttendanceStatus, justificativa?: string) => void;
  onUnseat: () => void;
  onAssignRole: () => void;
};

const OPTION_STYLE: Record<AttendanceStatus, { Icon: typeof CheckIcon; active: string }> = {
  PRESENTE: { Icon: CheckIcon, active: 'border-success bg-success-soft text-success' },
  ATRASADO: { Icon: ClockIcon, active: 'border-warning-line bg-warning-soft text-warning' },
  JUSTIFICADO: { Icon: LockClosedIcon, active: 'border-brand-900 bg-brand-50 text-brand-900' },
  AUSENTE: { Icon: XMarkIcon, active: 'border-danger bg-danger-soft text-danger' },
};

function describe(student: RollCallStudent) {
  const status = student.status ? STATUS_LABEL[student.status] : 'Sem registro';
  return student.lugar === null ? `Fora da mesa • ${status}` : `Lugar ${student.lugar} • ${status}`;
}

type StatusOptionsProps = {
  options: AttendanceStatus[];
  current: AttendanceStatus | null;
  onPick: (status: AttendanceStatus) => void;
};

function StatusOptions({ options, current, onPick }: StatusOptionsProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Presença"
      className={cn('grid gap-2', options.length === 3 ? 'grid-cols-3' : 'grid-cols-2')}
    >
      {options.map((status) => {
        const { Icon, active } = OPTION_STYLE[status];
        return (
          <button
            key={status}
            type="button"
            role="radio"
            aria-checked={current === status}
            onClick={() => onPick(status)}
            className={cn(
              'flex h-12 items-center justify-center gap-1.5 rounded-xl border text-sm font-semibold transition-[background-color,border-color,color,scale] duration-200 active:scale-95 focus-visible:outline-2 focus-visible:outline-brand-900',
              current === status ? active : 'border-black/10 bg-white text-muted hover:bg-black/5',
            )}
          >
            <Icon className="size-4" strokeWidth={2.5} aria-hidden />
            {STATUS_LABEL[status]}
          </button>
        );
      })}
    </div>
  );
}

function SeatedActions({
  onAssignRole,
  onUnseat,
}: Pick<PresenceSheetProps, 'onAssignRole' | 'onUnseat'>) {
  return (
    <>
      <button
        type="button"
        onClick={onAssignRole}
        className="h-12 rounded-xl border border-warning-line bg-warning-soft font-semibold text-warning transition-[scale] duration-200 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-warning"
      >
        Atribuir papel na sessão
      </button>
      <button
        type="button"
        onClick={onUnseat}
        className="h-12 rounded-xl border border-black/10 bg-white font-semibold text-muted transition-[background-color,scale] duration-200 hover:bg-black/5 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-brand-900"
      >
        Tirar da mesa
      </button>
    </>
  );
}

export function PresenceSheet({
  student,
  onClose,
  onStatus,
  onUnseat,
  onAssignRole,
}: PresenceSheetProps) {
  const [isJustifying, setIsJustifying] = useState(false);
  if (!student) return null;
  const isSeated = student.lugar !== null;
  const options: AttendanceStatus[] = isSeated
    ? ['PRESENTE', 'ATRASADO', 'JUSTIFICADO']
    : ['JUSTIFICADO', 'AUSENTE'];

  function pick(status: AttendanceStatus) {
    if (status === 'JUSTIFICADO') setIsJustifying(true);
    else onStatus(status);
  }

  return (
    <Sheet
      isOpen
      title={student.nome}
      description={describe(student)}
      leading={<StudentAvatar student={student} className="size-12 text-base" />}
      onClose={onClose}
    >
      <div className="flex flex-col gap-3">
        <StatusOptions
          options={options}
          current={isJustifying ? 'JUSTIFICADO' : student.status}
          onPick={pick}
        />
        {isJustifying ? (
          <JustificationForm
            initialValue={student.justificativa ?? ''}
            onCancel={() => setIsJustifying(false)}
            onConfirm={(text) => onStatus('JUSTIFICADO', text)}
          />
        ) : (
          isSeated && <SeatedActions onAssignRole={onAssignRole} onUnseat={onUnseat} />
        )}
      </div>
    </Sheet>
  );
}
