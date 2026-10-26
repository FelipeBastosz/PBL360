import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { planningPokerService } from '@/services/planningPoker.service';
import type { PlanningPokerState } from '@/types/planningPoker';
import { CardsIcon } from '../planning-poker/CardsIcon';
import { LiveBadge } from '../planning-poker/PokerStatusBar';

type StudentPokerNoticeProps = {
  sessionId: string;
  pokerPath: string;
};

function roundLabel(state: PlanningPokerState): string {
  const total = state.participantes.length;
  const current = state.rodadaAtual?.numero ?? state.concluidas.length + 1;
  return `Rodada ${Math.min(current, total)} de ${total}`;
}

export function StudentPokerNotice({ sessionId, pokerPath }: StudentPokerNoticeProps) {
  const navigate = useNavigate();
  const [state, setState] = useState<PlanningPokerState | null>(null);
  const { run: load } = useAsyncAction(planningPokerService.getState);

  useEffect(() => {
    if (!sessionId) return;
    load(sessionId).then((result) => result.ok && setState(result.data));
  }, [load, sessionId]);

  if (!state) return null;

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-black/5 bg-white shadow-[0_14px_28px_-18px_rgb(0_0_119/0.45)]">
      <div className="h-1 bg-brand-900" />
      <div className="flex flex-col gap-3 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <LiveBadge />
          <span className="text-[13px] text-muted">{roundLabel(state)}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-900">
            <CardsIcon className="size-[26px]" />
          </span>
          <div className="flex min-w-0 flex-col">
            <span className="text-lg leading-snug font-semibold text-ink">
              Planning poker em andamento
            </span>
            <span className="text-[13px] text-muted">
              Seu tutor está conduzindo a avaliação coletiva na mesa.
            </span>
          </div>
        </div>
        <Button onClick={() => navigate(pokerPath)}>Participar</Button>
      </div>
    </div>
  );
}
