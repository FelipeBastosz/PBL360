import { useState } from 'react';
import { XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { useEscapeKey } from '@/hooks/useEscapeKey';
import {
  EMPTY_DEADLINE,
  resolveDeadline,
  type DeadlineDraft,
  type DeadlineErrors,
} from '@/utils/deadlineForm';
import { DeadlineFields } from './DeadlineFields';

type ReleaseModalProps = {
  isOpen: boolean;
  type: 'autoavaliacao' | 'pares' | null;
  activeOtherType?: 'autoavaliacao' | 'pares' | null;
  isLoading: boolean;
  errorMessage?: string | null;
  onConfirm: (prazo: string | null) => void;
  onCancel: () => void;
};

function OtherReleaseWarning({ otherName }: { otherName: string }) {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-left text-xs text-amber-800">
      <ExclamationTriangleIcon className="mt-0.5 size-4 shrink-0 text-amber-600" />
      <span>
        A <strong>{otherName}</strong> está ativa no momento. Ao confirmar, ela será{' '}
        <strong>automaticamente desativada</strong>.
      </span>
    </div>
  );
}

function SetDeadlineActions({
  isLoading,
  onConfirm,
  onCancel,
}: {
  isLoading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="mt-2 flex flex-col gap-2">
      <Button isLoading={isLoading} onClick={onConfirm}>
        Confirmar liberação
      </Button>
      <Button variant="link" disabled={isLoading} onClick={onCancel}>
        Cancelar
      </Button>
    </div>
  );
}

function CloseButton({ isLoading, onClose }: { isLoading: boolean; onClose: () => void }) {
  return (
    <button
      type="button"
      onClick={isLoading ? undefined : onClose}
      disabled={isLoading}
      aria-label="Fechar"
      className="absolute right-4 top-4 rounded-full p-1 text-ink/60 hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-brand-900"
    >
      <XMarkIcon className="size-6" />
    </button>
  );
}

export function SetDeadlineModal({
  isOpen,
  type,
  activeOtherType,
  isLoading,
  errorMessage,
  onConfirm,
  onCancel,
}: ReleaseModalProps) {
  const [draft, setDraft] = useState<DeadlineDraft>(EMPTY_DEADLINE);
  const [errors, setErrors] = useState<DeadlineErrors>({});
  useEscapeKey(isOpen, onCancel, isLoading);

  if (!isOpen) return null;

  const currentName = type === 'autoavaliacao' ? 'Autoavaliação' : 'Avaliação por pares';
  const otherName = activeOtherType === 'autoavaliacao' ? 'Autoavaliação' : 'Avaliação por pares';

  const handleChange = (next: DeadlineDraft) => {
    setDraft(next);
    setErrors({});
  };

  const handleConfirm = () => {
    const result = resolveDeadline(draft);
    if (result.ok) onConfirm(result.prazo);
    else setErrors(result.errors);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="release-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
    >
      <div className="relative max-h-full w-full max-w-sm overflow-y-auto rounded-[24px] bg-white p-6 shadow-2xl animate-pop-in">
        <CloseButton isLoading={isLoading} onClose={onCancel} />

        <div className="mt-2 flex flex-col gap-3 text-center">
          <h2 id="release-modal-title" className="px-8 text-xl font-bold text-brand-900">
            Liberar {currentName}
          </h2>
          <p className="text-xs text-muted">
            Defina um prazo limite para os alunos enviarem ou deixe em branco para liberar sem
            prazo.
          </p>

          {activeOtherType && <OtherReleaseWarning otherName={otherName} />}
          {errorMessage && <Alert tone="error">{errorMessage}</Alert>}

          <DeadlineFields draft={draft} errors={errors} onChange={handleChange} />

          <SetDeadlineActions isLoading={isLoading} onConfirm={handleConfirm} onCancel={onCancel} />
        </div>
      </div>
    </div>
  );
}

type LockModalProps = {
  isOpen: boolean;
  enviadas: number;
  isLoading: boolean;
  errorMessage?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmLockModal({
  isOpen,
  enviadas,
  isLoading,
  errorMessage,
  onConfirm,
  onCancel,
}: LockModalProps) {
  useEscapeKey(isOpen, onCancel, isLoading);
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="lock-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
    >
      <div className="relative max-h-full w-full max-w-sm overflow-y-auto rounded-[24px] bg-white p-6 text-center shadow-2xl animate-pop-in">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-amber-100 text-amber-600">
          <ExclamationTriangleIcon className="size-7" />
        </div>
        <h2 id="lock-modal-title" className="mt-4 text-xl font-bold text-ink">
          Desativar avaliações?
        </h2>
        <p className="mt-2 text-xs text-muted leading-relaxed">
          <strong>{enviadas} alunos</strong> já enviaram suas respostas. Ao desativar, os envios
          feitos serão preservados, mas novos envios e edições serão bloqueados.
        </p>

        {errorMessage && (
          <div className="mt-2">
            <Alert tone="error">{errorMessage}</Alert>
          </div>
        )}

        <div className="mt-6 flex flex-col gap-2">
          <Button isLoading={isLoading} onClick={onConfirm}>
            Sim, desativar e bloquear
          </Button>
          <Button variant="link" disabled={isLoading} onClick={onCancel} className="text-muted">
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  );
}
