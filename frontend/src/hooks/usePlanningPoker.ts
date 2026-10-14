import { useCallback, useEffect, useState } from 'react';
import type { ApiError } from '@/services/apiError';
import { planningPokerService } from '@/services/planningPoker.service';
import type { PokerEventName } from '@/services/pokerSocket';
import type { PlanningPokerState, PokerVoteEvent } from '@/types/planningPoker';
import { usePokerChannel } from './usePokerChannel';
import { useAsyncAction } from './useAsyncAction';

function withVotes(state: PlanningPokerState, event: PokerVoteEvent): PlanningPokerState {
  const round = state.rodadaAtual;
  if (!round || round.rodadaId !== event.rodadaId) return state;
  const voted = new Set(event.lugaresQueVotaram);
  return {
    ...state,
    rodadaAtual: {
      ...round,
      votaram: event.votaram,
      lugaresQueVotaram: event.lugaresQueVotaram,
      mesa: round.mesa.map((seat) => ({ ...seat, votou: voted.has(seat.lugar) })),
    },
  };
}

export function usePlanningPoker(sessionId: string) {
  const [state, setState] = useState<PlanningPokerState | null>(null);
  const [isClosed, setIsClosed] = useState(false);
  const [loadError, setLoadError] = useState<ApiError | null>(null);
  const { run: load, isLoading } = useAsyncAction(planningPokerService.getState);

  const apply = useCallback((result: Awaited<ReturnType<typeof load>>) => {
    if (result.ok) {
      setState(result.data);
      setLoadError(null);
    } else if (result.error.status === 404) {
      setState(null);
      setIsClosed(true);
    } else setLoadError(result.error);
  }, []);

  const refresh = useCallback(() => load(sessionId).then(apply), [apply, load, sessionId]);

  useEffect(() => {
    load(sessionId).then(apply);
  }, [apply, load, sessionId]);

  const onEvent = useCallback(
    (name: PokerEventName, payload: unknown) => {
      if (name === 'poker.voto_registrado') {
        setState((current) => current && withVotes(current, payload as PokerVoteEvent));
        return;
      }
      if (name === 'poker.encerrado') setIsClosed(true);
      void refresh();
    },
    [refresh],
  );

  const connection = usePokerChannel(sessionId, Boolean(state) && !isClosed, {
    onEvent,
    onResync: () => void refresh(),
  });

  return { state, isClosed, isLoading, loadError, connection, refresh };
}
