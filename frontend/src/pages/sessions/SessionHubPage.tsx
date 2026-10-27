import { Alert } from '@/components/ui/Alert';
import { PAGE_CONTAINER_CLASS } from '@/components/ui/cardStyles';
import { cn } from '@/utils/cn';
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
      <main
        className={cn(
          PAGE_CONTAINER_CLASS,
          'mt-6 grid gap-4 lg:grid-cols-2 lg:items-start [&>*]:min-w-0',
        )}
      >
        {hub.combinedError && !hub.releases ? (
          <Alert tone="error" className="lg:col-span-2">
            {hub.combinedError.message}
          </Alert>
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
