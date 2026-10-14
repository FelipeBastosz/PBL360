import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { useToast } from '@/hooks/useToast';
import { planningPokerService } from '@/services/planningPoker.service';
import type { PlanningPokerAvailability, PokerOrder } from '@/types/planningPoker';

export function usePlanningPokerEntry(sessionId: string, pokerPath: string, refreshKey: unknown) {
  const navigate = useNavigate();
  const { notify } = useToast();
  const [availability, setAvailability] = useState<PlanningPokerAvailability | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const { run: load } = useAsyncAction(planningPokerService.getAvailability);
  const { run: start, isLoading } = useAsyncAction(planningPokerService.start);

  useEffect(() => {
    if (!sessionId) return;
    load(sessionId).then((result) => result.ok && setAvailability(result.data));
  }, [load, sessionId, refreshKey]);

  function open() {
    if (availability?.pokerAbertoId) navigate(pokerPath);
    else if (availability?.disponivel) setIsStarting(true);
  }

  async function confirmStart(anonimo: boolean, ordem: PokerOrder) {
    const result = await start(sessionId, { anonimo, ordem });
    if (result.ok) navigate(pokerPath);
    else notify({ tone: 'error', message: result.error.message });
  }

  return {
    availability,
    isStarting,
    isLoading,
    open,
    confirmStart: (anonimo: boolean, ordem: PokerOrder) => void confirmStart(anonimo, ordem),
    cancelStart: () => setIsStarting(false),
  };
}
