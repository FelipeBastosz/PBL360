import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeftIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { UserMenuButton } from '@/components/layout/UserMenu';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { CARD_CLASS, PAGE_CONTAINER_CLASS } from '@/components/ui/cardStyles';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { Spinner } from '@/components/ui/Spinner';
import { useAuth } from '@/hooks/useAuth';
import type { UserResponse } from '@/types/auth';
import type { SessionRole } from '@/types/session';
import { cn } from '@/utils/cn';
import { formatDeadline } from '@/utils/formatDate';
import { roleLabel } from '@/utils/sessionRoles';
import { CriterionStepper } from './components/CriterionStepper';
import { EvaluationFinalScore } from './components/EvaluationFinalScore';
import { NonParticipantEmptyState } from './components/NonParticipantEmptyState';
import { useStudentPeerEvaluation, type PeerEvaluationState } from './useStudentPeerEvaluation';

function PeerCardHeader({
  name,
  papel,
  isSubmitted,
}: {
  name: string;
  papel?: SessionRole | null;
  isSubmitted: boolean;
}) {
  return (
    <div className="mb-2 flex items-center justify-between border-b border-black/5 pb-4">
      <div className="flex items-center gap-4">
        <span className="flex size-12 items-center justify-center rounded-xl bg-surface">
          <UserCircleIcon className="size-7 text-ink" />
        </span>
        <div className="flex flex-col">
          <span className="text-lg font-semibold text-ink">{name}</span>
          {papel && (
            <span className="text-xs font-semibold text-warning">Papel: {roleLabel(papel)}</span>
          )}
        </div>
      </div>
      {isSubmitted && (
        <span className="text-xs font-semibold text-success">Avaliação já enviada</span>
      )}
    </div>
  );
}

function PeerRoleCriterionStepper({
  peer,
  isSaving,
  onCargoChange,
}: {
  peer: PeerEvaluationState;
  isSaving: boolean;
  onCargoChange: (peerId: string, s: number) => void;
}) {
  if (!peer.papel) return null;
  return (
    <div className="pt-2">
      <CriterionStepper
        criterion={{
          id: 'cargo-score',
          nome: `Desempenho como ${roleLabel(peer.papel)}`,
          peso: 3.0,
          ordem: 99,
          notaMaxima: 10,
        }}
        score={peer.notaCargo ?? 0}
        disabled={peer.isSubmitted || isSaving}
        onChange={(_id, s) => onCargoChange(peer.peerId, s)}
      />
    </div>
  );
}

function PeerEvaluationCard({
  peer,
  isSaving,
  onCriterionChange,
  onCargoChange,
}: {
  peer: PeerEvaluationState;
  isSaving: boolean;
  onCriterionChange: (peerId: string, critId: string, s: number) => void;
  onCargoChange: (peerId: string, s: number) => void;
}) {
  return (
    <section aria-label={`Avaliação de ${peer.name}`} className={cn(CARD_CLASS, 'p-4')}>
      <PeerCardHeader name={peer.name} papel={peer.papel} isSubmitted={peer.isSubmitted} />
      <div>
        <div className="divide-y divide-black/5">
          {peer.criteria.map((c) => (
            <CriterionStepper
              key={c.id}
              criterion={c}
              score={peer.scores[c.id] ?? 0}
              disabled={peer.isSubmitted || isSaving}
              onChange={(critId, s) => onCriterionChange(peer.peerId, critId, s)}
            />
          ))}
          <PeerRoleCriterionStepper peer={peer} isSaving={isSaving} onCargoChange={onCargoChange} />
        </div>
        <EvaluationFinalScore
          criteria={peer.criteria}
          scores={peer.scores}
          bonus={peer.papel ? peer.notaCargo : null}
        />
      </div>
    </section>
  );
}

function PeerEvaluationHeader({
  user,
  subtitle,
  deadline,
  onBack,
}: {
  user: Pick<UserResponse, 'id' | 'nome' | 'possuiFoto'> | null;
  subtitle: string;
  deadline?: string | null;
  onBack: () => void;
}) {
  return (
    <header className="shrink-0 bg-brand-900 text-white">
      <div className={cn(PAGE_CONTAINER_CLASS, 'flex min-h-16 items-center justify-between py-2')}>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            aria-label="Voltar"
            className="-ml-1 rounded-full p-2 transition-[background-color,scale] duration-200 hover:bg-white/10 active:scale-90 focus-visible:outline-2 focus-visible:outline-white"
          >
            <ChevronLeftIcon className="size-6" />
          </button>
          <div className="flex flex-col">
            <h1 className="text-base font-semibold leading-tight">Avaliação dos Colegas</h1>
            <span className="text-xs text-white/70">{subtitle}</span>
            {deadline && (
              <span className="text-xs text-white/80">Prazo: {formatDeadline(deadline)}</span>
            )}
          </div>
        </div>
        <UserMenuButton user={user} className="ring-2 ring-white/20" />
      </div>
    </header>
  );
}

function PeerListBody({ state }: { state: ReturnType<typeof useStudentPeerEvaluation> }) {
  if (state.isLoading) {
    return (
      <div className="mt-10 flex justify-center">
        <Spinner className="size-8 text-brand-900" />
      </div>
    );
  }
  if (state.didNotParticipate) {
    return <NonParticipantEmptyState />;
  }
  if (state.peers.length === 0) {
    return (
      <p className="mt-10 text-center text-sm text-muted">
        Nenhum colega disponível para avaliação nesta sessão.
      </p>
    );
  }
  return (
    <>
      {state.peers.map((peer) => (
        <PeerEvaluationCard
          key={peer.peerId}
          peer={peer}
          isSaving={state.isSaving}
          onCriterionChange={state.setScore}
          onCargoChange={state.setCargoScore}
        />
      ))}
    </>
  );
}

export default function StudentPeerEvaluationPage() {
  const { sessionId = '' } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const state = useStudentPeerEvaluation(sessionId);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  return (
    <div className="min-h-dvh bg-surface pb-24">
      <PeerEvaluationHeader
        user={user}
        subtitle={state.session?.titulo || 'Sessão'}
        deadline={state.prazo}
        onBack={() => navigate(-1)}
      />
      <main className={cn(PAGE_CONTAINER_CLASS, 'mt-6 flex flex-col gap-6')}>
        {state.error && <Alert tone="error">{state.error.message}</Alert>}
        {state.saveError && <Alert tone="error">{state.saveError.message}</Alert>}
        <PeerListBody state={state} />
        {state.canSave && (
          <Button
            onClick={() => setIsConfirmOpen(true)}
            disabled={state.isSaving || state.isLoading}
            className="w-full"
          >
            {state.isSaving ? 'Enviando...' : 'Enviar avaliação'}
          </Button>
        )}
      </main>
      <ConfirmationModal
        isOpen={isConfirmOpen}
        isLoading={state.isSaving}
        title="Confirmar envio da avaliação?"
        description="Após o envio definitivo, não será possível alterar as notas."
        confirmLabel="Confirmar Envio"
        onConfirm={async () => {
          await state.handleSave();
          setIsConfirmOpen(false);
        }}
        onClose={() => setIsConfirmOpen(false)}
      />
    </div>
  );
}
