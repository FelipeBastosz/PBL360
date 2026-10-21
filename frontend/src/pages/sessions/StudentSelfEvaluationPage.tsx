import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeftIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { UserMenuButton } from '@/components/layout/UserMenu';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { CARD_CLASS, PAGE_CONTAINER_CLASS } from '@/components/ui/cardStyles';
import { Spinner } from '@/components/ui/Spinner';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { evaluationService } from '@/services/evaluation.service';
import { sessionService } from '@/services/session.service';
import type { EvaluationCriterion, SelfAssessmentResponse } from '@/types/evaluation';
import type { MemberSession } from '@/types/session';
import type { UserResponse } from '@/types/auth';
import { cn } from '@/utils/cn';

type CriterionStepperProps = {
  criterion: EvaluationCriterion;
  score: number;
  disabled: boolean;
  onChange: (id: string, newScore: number) => void;
};

function CriterionStepper({ criterion, score, disabled, onChange }: CriterionStepperProps) {
  const max = criterion.notaMaxima ?? 10;
  const handleDecrease = () => onChange(criterion.id, Math.max(0, score - 1));
  const handleIncrease = () => onChange(criterion.id, Math.min(max, score + 1));

  return (
    <div
      role="group"
      aria-label={criterion.nome}
      className="flex items-center justify-between border-b border-black/5 py-4 last:border-0"
    >
      <div className="flex flex-col">
        <span className="font-semibold text-brand-900">{criterion.nome}</span>
        <span className="text-sm text-muted">
          Peso {criterion.peso.toLocaleString('pt-BR', { minimumFractionDigits: 1 })}
        </span>
      </div>
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={handleDecrease}
          disabled={disabled || score <= 0}
          className="flex size-10 items-center justify-center rounded-lg border border-black/10 bg-white text-brand-900 active:bg-surface disabled:opacity-50"
        >
          <span className="text-xl leading-none">&minus;</span>
        </button>
        <span className="w-6 text-center text-lg font-semibold text-ink">{score}</span>
        <button
          type="button"
          onClick={handleIncrease}
          disabled={disabled || score >= max}
          className="flex size-10 items-center justify-center rounded-lg border border-black/10 bg-white text-brand-900 active:bg-surface disabled:opacity-50"
        >
          <span className="text-xl leading-none">+</span>
        </button>
      </div>
    </div>
  );
}

function SelfEvaluationHeader({
  user,
  subtitle,
  onBack,
}: {
  user: Pick<UserResponse, 'id' | 'nome' | 'possuiFoto'> | null;
  subtitle: string;
  onBack: () => void;
}) {
  return (
    <header className="shrink-0 bg-brand-900 text-white">
      <div className={cn(PAGE_CONTAINER_CLASS, 'flex h-16 items-center justify-between')}>
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
          </div>
        </div>
        <UserMenuButton user={user} className="ring-2 ring-white/20" />
      </div>
    </header>
  );
}

function buildInitialScores(data: SelfAssessmentResponse): Record<string, number> {
  const scores: Record<string, number> = {};
  data.criterios.forEach((c) => {
    const found = data.itens.find((i) => i.criterioId === c.id);
    scores[c.id] = found?.nota ?? 0;
  });
  return scores;
}

export default function StudentSelfEvaluationPage() {
  const { sessionId = '' } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { notify } = useToast();
  const [data, setData] = useState<SelfAssessmentResponse | null>(null);
  const [session, setSession] = useState<MemberSession | null>(null);
  const [scores, setScores] = useState<Record<string, number>>({});

  const { run: loadSession } = useAsyncAction(
    useCallback(() => sessionService.getForMember(sessionId), [sessionId]),
  );

  const {
    run: loadEvaluation,
    isLoading,
    error,
  } = useAsyncAction(
    useCallback(() => evaluationService.getSelfAssessment(sessionId), [sessionId]),
  );

  const {
    run: submitEvaluation,
    isLoading: isSaving,
    error: saveError,
  } = useAsyncAction(
    useCallback(
      () =>
        evaluationService.saveSelfAssessment(sessionId, {
          itens: Object.entries(scores).map(([criterioId, nota]) => ({ criterioId, nota })),
          enviar: true,
        }),
      [sessionId, scores],
    ),
  );

  useEffect(() => {
    loadSession().then((res) => res.ok && setSession(res.data));
    loadEvaluation().then((result) => {
      if (result.ok) {
        setData(result.data);
        setScores(buildInitialScores(result.data));
      }
    });
  }, [loadSession, loadEvaluation]);

  const handleScoreChange = (id: string, newScore: number) => {
    setScores((prev) => ({ ...prev, [id]: newScore }));
  };

  const handleSave = async () => {
    const result = await submitEvaluation();
    if (result.ok) {
      notify({ tone: 'success', message: 'Autoavaliação enviada com sucesso!' });
      navigate(-1);
    }
  };

  const isSubmitted = data?.status === 'ENVIADA';

  return (
    <div className="min-h-dvh bg-surface pb-24">
      <SelfEvaluationHeader
        user={user}
        subtitle={session?.titulo || 'Sessão'}
        onBack={() => navigate(-1)}
      />

      <main className={cn(PAGE_CONTAINER_CLASS, 'mt-6 flex flex-col gap-6')}>
        {error && <Alert tone="error">{error.message}</Alert>}
        {saveError && <Alert tone="error">{saveError.message}</Alert>}

        <div className={cn(CARD_CLASS, 'flex-row items-center gap-4 p-4')}>
          <span className="flex size-12 items-center justify-center rounded-xl bg-surface">
            <UserCircleIcon className="size-7 text-ink" />
          </span>
          <div className="flex flex-col">
            <span className="text-lg font-semibold text-ink">{user?.nome || 'Aluno'}</span>
            {isSubmitted && (
              <span className="text-xs font-semibold text-success">Avaliação já enviada</span>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="mt-10 flex justify-center">
            <Spinner className="size-8 text-brand-900" />
          </div>
        ) : (
          data && (
            <div className={cn(CARD_CLASS, 'px-4')}>
              {data.criterios.map((criterion) => (
                <CriterionStepper
                  key={criterion.id}
                  criterion={criterion}
                  score={scores[criterion.id] ?? 0}
                  disabled={isSubmitted || isSaving}
                  onChange={handleScoreChange}
                />
              ))}
            </div>
          )
        )}

        {!isSubmitted && (
          <Button onClick={handleSave} disabled={isLoading || isSaving || !data} className="w-full">
            {isSaving ? 'Enviando...' : 'Salvar Autoavaliação'}
          </Button>
        )}
      </main>
    </div>
  );
}
