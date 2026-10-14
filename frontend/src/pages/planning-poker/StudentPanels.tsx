import { CheckIcon, InformationCircleIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import type { PokerRound } from '@/types/planningPoker';
import { firstName, formatPokerGrade } from '@/utils/pokerFormat';

function VoteCount({ round }: { round: PokerRound }) {
  return (
    <span className="text-center text-[13px] text-muted">
      {round.votaram} de {round.votantesEsperados} colegas votaram
    </span>
  );
}

export function WaitingNotice() {
  return (
    <p className="text-center text-[13px] text-pretty text-muted">
      Mantenha esta tela aberta. A carta aparece assim que a rodada começar.
    </p>
  );
}

type VotedPanelProps = { round: PokerRound; canChange: boolean; onChange: () => void };

export function VotedPanel({ round, canChange, onChange }: VotedPanelProps) {
  return (
    <>
      <div className="flex flex-col gap-3 rounded-2xl border border-success/30 bg-success-soft p-4">
        <div className="flex items-start gap-2.5">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-success">
            <CheckIcon className="size-4 text-white" strokeWidth={3} aria-hidden />
          </span>
          <div className="flex flex-col gap-0.5">
            <span className="text-[15px] leading-snug font-semibold text-success">
              Voto enviado — você pode trocar até o tutor revelar
            </span>
            <span className="text-sm text-ink">
              Seu voto para {firstName(round.avaliado.nome)}:{' '}
              <strong className="font-bold">{formatPokerGrade(round.meuVoto)}</strong>
            </span>
          </div>
        </div>
        <Button variant="outline" onClick={onChange} disabled={!canChange}>
          Trocar voto
        </Button>
      </div>
      <VoteCount round={round} />
    </>
  );
}

export function EvaluatedPanel({ round }: { round: PokerRound }) {
  return (
    <>
      <div
        role="status"
        className="flex items-start gap-2.5 rounded-2xl border border-brand-100 bg-brand-50 p-4 text-brand-900"
      >
        <UserCircleIcon className="size-6 shrink-0" aria-hidden />
        <div className="flex flex-col gap-0.5">
          <span className="text-[15px] leading-snug font-semibold">
            Você está sendo avaliado nesta rodada
          </span>
          <span className="text-[13px] text-muted">
            Seus colegas estão votando. Você não vota na própria rodada.
          </span>
        </div>
      </div>
      <VoteCount round={round} />
    </>
  );
}

export function RevealNotice({ round }: { round: PokerRound }) {
  return (
    <div className="flex items-start gap-2 rounded-[10px] border border-brand-300/40 bg-brand-50 p-3 text-sm text-brand-900">
      <InformationCircleIcon className="mt-px size-5 shrink-0" aria-hidden />
      <div className="flex-1">
        Média de {round.revelacao?.totalVotos ?? 0} votos. A nota final é definida pelo tutor.
      </div>
    </div>
  );
}
