import { Alert } from '@/components/ui/Alert';
import { SessionHubHeader } from './SessionHubHeader';
import { SessionHubContent } from './SessionHubContent';
import { SessionReleaseModals } from './SessionReleaseModals';
import { useSessionHub } from './useSessionHub';

export default function SessionHubPage() {
  const hub = useSessionHub();

  return (
    <div className="min-h-dvh bg-surface pb-12">
      <SessionHubHeader
        session={hub.session}
        problem={hub.problem}
        userNome={hub.user?.nome}
        backUrl={hub.backUrl}
      />
      <main className="mx-auto mt-6 flex w-full max-w-md flex-col gap-4 px-4">
        {hub.combinedError && !hub.releases ? (
          <Alert tone="error">{hub.combinedError.message}</Alert>
        ) : (
          <SessionHubContent
            isLoading={hub.isLoading}
            isProfessor={hub.isProfessor}
            basePath={hub.basePath}
            sessionId={hub.sessionId}
            releases={hub.releases}
            onToggle={hub.handleToggleClick}
            isAttendancePending={hub.isAttendancePending}
            isUpdating={hub.isUpdating}
          />
        )}
      </main>
      <SessionReleaseModals
        modalType={hub.modalType}
        typeToLock={hub.typeToLock}
        activeOtherType={hub.activeOtherType}
        releases={hub.releases}
        isLoading={hub.isUpdating}
        errorMessage={hub.releaseError?.message}
        onConfirmRelease={hub.confirmRelease}
        onCloseRelease={hub.closeReleaseModal}
        onConfirmLock={hub.confirmLock}
        onCloseLock={hub.closeLockModal}
      />
    </div>
  );
}
