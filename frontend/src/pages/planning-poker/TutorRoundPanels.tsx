import { Button } from '@/components/ui/Button';
import type { PokerRound } from '@/types/planningPoker';
import { countLabel } from '@/utils/countLabel';
import { formatPokerVote } from '@/utils/pokerFormat';
import { PokerCard, TextLink } from './PokerCard';

type VotingPanelProps = {
  round: PokerRound;
  canReveal: boolean;
  isBusy: boolean;
  onReveal: () => void;
  onCancel: () => void;
};

export function TutorVotingPanel({
  round,
  canReveal,
  isBusy,
  onReveal,
  onCancel,
}: VotingPanelProps) {
  const percent = round.votantesEsperados
    ? Math.round((round.votaram / round.votantesEsperados) * 100)
    : 0;
  return (
    <>
      <PokerCard className="gap-2.5">
        <span className="text-[22px] font-bold text-ink">
          <span className="text-brand-900">{round.votaram}</span> de {round.votantesEsperados}{' '}
          votaram
        </span>
        <div className="h-2 overflow-hidden rounded-full bg-brand-50">
          <div
            className="h-full rounded-full bg-brand-900 transition-[width] duration-300 ease-out"
            style={{ width: `${percent}%` }}
          />
        </div>
        <span className="text-[13px] text-muted">As notas ficam ocultas até você revelar.</span>
      </PokerCard>
      <Button onClick={onReveal} disabled={!canReveal} isLoading={isBusy}>
        Revelar votos
      </Button>
      <TextLink tone="muted" onClick={onCancel}>
        Cancelar rodada
      </TextLink>
    </>
  );
}

type Distribution = { label: string; count: number; percent: number };

function distributionOf(round: PokerRound): Distribution[] {
  const groups = new Map<number, number>();
  round.revelacao?.votos.forEach(({ nota }) => groups.set(nota, (groups.get(nota) ?? 0) + 1));
  const highest = Math.max(1, ...groups.values());
  return [...groups.entries()]
    .sort(([left], [right]) => left - right)
    .map(([nota, count]) => ({
      label: formatPokerVote(nota),
      count,
      percent: Math.round((count / highest) * 100),
    }));
}

function summaryOf(round: PokerRound): string {
  const notes = round.revelacao?.votos.map((vote) => vote.nota) ?? [];
  const total = countLabel(notes.length, 'voto', 'votos');
  if (notes.length === 0) return total;
  const range = `de ${formatPokerVote(Math.min(...notes))} a ${formatPokerVote(Math.max(...notes))}`;
  return `${total} · ${range}`;
}

type RevealPanelProps = {
  round: PokerRound;
  isBusy: boolean;
  onAccept: () => void;
  onAdjust: () => void;
  onRevote: () => void;
};

export function TutorRevealPanel({
  round,
  isBusy,
  onAccept,
  onAdjust,
  onRevote,
}: RevealPanelProps) {
  const hasVotes = (round.revelacao?.totalVotos ?? 0) > 0;
  return (
    <>
      <PokerCard className="gap-2.5">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-sm font-bold text-brand-900">Distribuição dos votos</span>
          <span className="text-xs text-muted">{summaryOf(round)}</span>
        </div>
        {distributionOf(round).map((item) => (
          <div key={item.label} className="flex items-center gap-2.5">
            <span className="w-[34px] text-right text-sm font-semibold text-ink">{item.label}</span>
            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-brand-50">
              <div
                className="h-full rounded-full bg-brand-900"
                style={{ width: `${item.percent}%` }}
              />
            </div>
            <span className="w-[18px] text-right text-[13px] text-muted">{item.count}</span>
          </div>
        ))}
      </PokerCard>
      <Button onClick={onAccept} disabled={!hasVotes} isLoading={isBusy}>
        Aceitar média
      </Button>
      <Button variant="outline" onClick={onAdjust}>
        Reajustar nota
      </Button>
      <TextLink onClick={onRevote}>Votar novamente</TextLink>
    </>
  );
}
