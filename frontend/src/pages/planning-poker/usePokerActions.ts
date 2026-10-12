import { useCallback, useState } from 'react';
import { useToast } from '@/hooks/useToast';
import { toApiError } from '@/services/apiError';
import { planningPokerService as poker } from '@/services/planningPoker.service';

export function usePokerActions(sessionId: string, refresh: () => Promise<unknown>) {
  const { notify } = useToast();
  const [isBusy, setIsBusy] = useState(false);

  const run = useCallback(
    async (action: () => Promise<unknown>, success?: string): Promise<boolean> => {
      setIsBusy(true);
      try {
        await action();
        if (success) notify({ tone: 'success', message: success });
        await refresh();
        return true;
      } catch (error) {
        notify({ tone: 'error', message: toApiError(error).message });
        return false;
      } finally {
        setIsBusy(false);
      }
    },
    [notify, refresh],
  );

  return {
    isBusy,
    openRound: (studentId?: string) => run(() => poker.openRound(sessionId, studentId)),
    cancelRound: (roundId: string) => run(() => poker.cancelRound(sessionId, roundId)),
    reveal: (roundId: string) => run(() => poker.reveal(sessionId, roundId)),
    revote: (roundId: string) => run(() => poker.revote(sessionId, roundId)),
    accept: (roundId: string) =>
      run(() => poker.decide(sessionId, roundId, { acao: 'ACEITAR' }), 'Média aceita.'),
    adjust: (roundId: string, nota: number, justificativa: string) =>
      run(
        () => poker.decide(sessionId, roundId, { acao: 'REAJUSTAR', nota, justificativa }),
        'Nota reajustada.',
      ),
    reorder: (fila: string[]) => run(() => poker.reorderQueue(sessionId, fila), 'Fila atualizada.'),
    close: () => run(() => poker.close(sessionId), 'Planning poker encerrado.'),
    vote: (roundId: string, nota: number) => run(() => poker.vote(sessionId, roundId, nota)),
  };
}

export type PokerActions = ReturnType<typeof usePokerActions>;
