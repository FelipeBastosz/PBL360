import type { SessionReleasesResponse } from '@/types/session';
import { SetDeadlineModal, ConfirmLockModal } from './components/EvaluationReleaseModals';

type SessionReleaseModalsProps = {
  modalType: 'autoavaliacao' | 'pares' | null;
  typeToLock: 'autoavaliacao' | 'pares' | null;
  activeOtherType: 'autoavaliacao' | 'pares' | null;
  releases: SessionReleasesResponse | null;
  isLoading: boolean;
  errorMessage?: string;
  onConfirmRelease: (prazo: string | null) => void;
  onCloseRelease: () => void;
  onConfirmLock: () => void;
  onCloseLock: () => void;
};

export function SessionReleaseModals({
  modalType,
  typeToLock,
  activeOtherType,
  releases,
  isLoading,
  errorMessage,
  onConfirmRelease,
  onCloseRelease,
  onConfirmLock,
  onCloseLock,
}: SessionReleaseModalsProps) {
  return (
    <>
      <SetDeadlineModal
        isOpen={Boolean(modalType)}
        type={modalType}
        activeOtherType={activeOtherType}
        isLoading={isLoading}
        errorMessage={errorMessage}
        onConfirm={onConfirmRelease}
        onCancel={onCloseRelease}
      />
      <ConfirmLockModal
        isOpen={Boolean(typeToLock)}
        enviadas={typeToLock ? (releases?.[typeToLock].enviadas ?? 0) : 0}
        isLoading={isLoading}
        errorMessage={errorMessage}
        onConfirm={onConfirmLock}
        onCancel={onCloseLock}
      />
    </>
  );
}
