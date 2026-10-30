import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeftIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { UserMenuButton } from '@/components/layout/UserMenu';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { CARD_CLASS, PAGE_CONTAINER_CLASS } from '@/components/ui/cardStyles';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { Spinner } from '@/components/ui/Spinner';
import { useAuth } from '@/hooks/useAuth';
import type { UserResponse } from '@/types/auth';
import { cn } from '@/utils/cn';
import { formatDeadline } from '@/utils/formatDate';
import { CriterionStepper } from './components/CriterionStepper';
import { EvaluationFinalScore } from './components/EvaluationFinalScore';
import { NonParticipantEmptyState } from './components/NonParticipantEmptyState';
import { useStudentSelfEvaluation } from './useStudentSelfEvaluation';

function SelfEvaluationHeader({
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
            <h1 className="text-base font-semibold leading-tight">Autoavaliação</h1>
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

function UserSelfCard({ name, isSubmitted }: { name?: string; isSubmitted?: boolean }) {
  return (
    <div className={cn(CARD_CLASS, 'flex-row items-center gap-4 p-4')}>
      <span className="flex size-12 items-center justify-center rounded-xl bg-surface">
        <UserCircleIcon className="size-7 text-ink" />
      </span>
      <div className="flex flex-col">
        <span className="text-lg font-semibold text-ink">{name || 'Aluno'}</span>
        {isSubmitted && (
          <span className="text-xs font-semibold text-success">Avaliação já enviada</span>
        )}
      </div>
    </div>
  );
}

function EvaluationCriteriaForm({
  evalState,
  isSubmitted,
  onOpenConfirm,
}: {
  evalState: ReturnType<typeof useStudentSelfEvaluation>;
  isSubmitted: boolean;
  onOpenConfirm: () => void;
}) {
  return (
    <>
      {evalState.data && (
        <div className={cn(CARD_CLASS, 'p-4')}>
          {evalState.data.criterios.map((c) => (
            <CriterionStepper
              key={c.id}
              criterion={c}
              score={evalState.scores[c.id] ?? 0}
              disabled={isSubmitted || evalState.isSaving}
              onChange={evalState.setScore}
            />
          ))}
          <div className="mt-2 border-t border-black/5 pt-2">
            <CriterionStepper
              criterion={{
                id: 'cargo-score',
                nome: 'Autoavaliação no cargo',
                peso: 3.0,
                ordem: 99,
                notaMaxima: 10,
              }}
              score={evalState.notaCargo ?? 0}
              disabled={isSubmitted || evalState.isSaving}
              onChange={(_id, s) => evalState.setNotaCargo?.(s)}
            />
          </div>
          <EvaluationFinalScore
            criteria={evalState.data.criterios}
            scores={evalState.scores}
            bonus={evalState.notaCargo}
          />
        </div>
      )}
      {!isSubmitted && (
        <Button
          onClick={onOpenConfirm}
          disabled={evalState.isLoading || evalState.isSaving || !evalState.data}
          className="w-full"
        >
          {evalState.isSaving ? 'Enviando...' : 'Enviar avaliação'}
        </Button>
      )}
    </>
  );
}

function EvaluationBody({
  evalState,
  userName,
  onOpenConfirm,
}: {
  evalState: ReturnType<typeof useStudentSelfEvaluation>;
  userName?: string;
  onOpenConfirm: () => void;
}) {
  const isSubmitted = evalState.data?.status === 'ENVIADA';

  if (evalState.didNotParticipate) {
    return (
      <main className={cn(PAGE_CONTAINER_CLASS, 'mt-6 flex flex-col gap-6')}>
        <NonParticipantEmptyState />
      </main>
    );
  }

  return (
    <main className={cn(PAGE_CONTAINER_CLASS, 'mt-6 flex flex-col gap-6')}>
      {evalState.error && <Alert tone="error">{evalState.error.message}</Alert>}
      {evalState.saveError && <Alert tone="error">{evalState.saveError.message}</Alert>}
      <UserSelfCard name={userName} isSubmitted={isSubmitted} />
      {evalState.isLoading ? (
        <div className="mt-10 flex justify-center">
          <Spinner className="size-8 text-brand-900" />
        </div>
      ) : (
        <EvaluationCriteriaForm
          evalState={evalState}
          isSubmitted={isSubmitted}
          onOpenConfirm={onOpenConfirm}
        />
      )}
    </main>
  );
}

export default function StudentSelfEvaluationPage() {
  const { sessionId = '' } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const evalState = useStudentSelfEvaluation(sessionId);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  return (
    <div className="min-h-dvh bg-surface pb-24">
      <SelfEvaluationHeader
        user={user}
        subtitle={evalState.session?.titulo || 'Sessão'}
        deadline={evalState.data?.prazo}
        onBack={() => navigate(-1)}
      />
      <EvaluationBody
        evalState={evalState}
        userName={user?.nome}
        onOpenConfirm={() => setIsConfirmOpen(true)}
      />
      <ConfirmationModal
        isOpen={isConfirmOpen}
        isLoading={evalState.isSaving}
        title="Confirmar envio da avaliação?"
        description="Após o envio definitivo, não será possível alterar as notas."
        confirmLabel="Confirmar Envio"
        onConfirm={async () => {
          await evalState.handleSave();
          setIsConfirmOpen(false);
        }}
        onClose={() => setIsConfirmOpen(false)}
      />
    </div>
  );
}
