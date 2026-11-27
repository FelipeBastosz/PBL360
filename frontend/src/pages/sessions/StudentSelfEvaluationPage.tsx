import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { UserCircleIcon } from '@heroicons/react/24/outline';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { CARD_CLASS, PAGE_CONTAINER_CLASS } from '@/components/ui/cardStyles';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { Spinner } from '@/components/ui/Spinner';
import { useAuth } from '@/hooks/useAuth';
import type { EvaluationFormula } from '@/types/evaluation';
import type { SessionRole } from '@/types/session';
import { cn } from '@/utils/cn';
import { getRolePercentage } from '@/utils/evaluationScore';
import { roleLabel } from '@/utils/sessionRoles';
import { CriterionStepper } from './components/CriterionStepper';
import { EvaluationFinalScore } from './components/EvaluationFinalScore';
import { NonParticipantEmptyState } from './components/NonParticipantEmptyState';
import { SelfEvaluationHeader } from './components/SelfEvaluationHeader';
import { useStudentSelfEvaluation } from './useStudentSelfEvaluation';

function UserSelfCard({
  name,
  papel,
  isSubmitted,
}: {
  name?: string;
  papel?: SessionRole | null;
  isSubmitted?: boolean;
}) {
  return (
    <div className={cn(CARD_CLASS, 'flex-row items-center gap-4 p-4')}>
      <span className="flex size-12 items-center justify-center rounded-xl bg-surface">
        <UserCircleIcon className="size-7 text-ink" />
      </span>
      <div className="flex flex-col">
        <span className="text-lg font-semibold text-ink">{name || 'Aluno'}</span>
        {papel && (
          <span className="text-xs font-semibold text-warning">Papel: {roleLabel(papel)}</span>
        )}
        {isSubmitted && (
          <span className="text-xs font-semibold text-success">Avaliação já enviada</span>
        )}
      </div>
    </div>
  );
}

function SelfRoleCriterionStepper({
  papel,
  formula,
  score,
  disabled,
  onChange,
}: {
  papel?: SessionRole | null;
  formula?: EvaluationFormula;
  score: number;
  disabled: boolean;
  onChange?: (s: number) => void;
}) {
  if (!papel) return null;
  const rolePercentage = getRolePercentage(formula);
  return (
    <div className="pt-2">
      <CriterionStepper
        criterion={{
          id: 'cargo-score',
          nome: `Desempenho como ${roleLabel(papel)}`,
          peso: 3.0,
          ordem: 99,
          notaMaxima: 10,
        }}
        subtitle={`Peso na fórmula (${rolePercentage}%)`}
        score={score}
        disabled={disabled}
        onChange={(_id, s) => onChange?.(s)}
      />
    </div>
  );
}

function SelfEvaluationCriteriaCard({
  evalState,
  isSubmitted,
}: {
  evalState: ReturnType<typeof useStudentSelfEvaluation>;
  isSubmitted: boolean;
}) {
  if (!evalState.data) return null;

  return (
    <div className={cn(CARD_CLASS, 'p-4')}>
      <div className="divide-y divide-border-subtle">
        {evalState.data.criterios.map((c) => (
          <CriterionStepper
            key={c.id}
            criterion={c}
            score={evalState.scores[c.id] ?? 0}
            disabled={isSubmitted || evalState.isSaving}
            onChange={evalState.setScore}
          />
        ))}
        <SelfRoleCriterionStepper
          papel={evalState.papel}
          formula={evalState.formula}
          score={evalState.notaCargo ?? 0}
          disabled={isSubmitted || evalState.isSaving}
          onChange={evalState.setNotaCargo}
        />
      </div>
      <EvaluationFinalScore
        criteria={evalState.data.criterios}
        scores={evalState.scores}
        roleScore={evalState.notaCargo}
        formula={evalState.formula}
        hasRole={Boolean(evalState.papel)}
      />
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
      <SelfEvaluationCriteriaCard evalState={evalState} isSubmitted={isSubmitted} />
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
  const isClosed = evalState.data?.status === 'ENCERRADA';

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
      {isClosed && (
        <Alert tone="info">
          O prazo da autoavaliação terminou e ela não foi enviada. As notas não podem mais ser
          alteradas.
        </Alert>
      )}
      <UserSelfCard name={userName} papel={evalState.papel} isSubmitted={isSubmitted} />
      {evalState.isLoading ? (
        <div className="mt-10 flex justify-center">
          <Spinner className="size-8 text-brand-accent" />
        </div>
      ) : (
        <EvaluationCriteriaForm
          evalState={evalState}
          isSubmitted={isSubmitted || isClosed}
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
