import { useCallback, useEffect, useState } from 'react';
import { sessionService } from '@/services/session.service';
import type { RollCall } from '@/types/session';
import {
  boardFromRollCall,
  hasChanges,
  savedBaseline,
  toAttendanceRecords,
  type RollCallBoard,
} from '@/utils/rollCallBoard';
import { useAsyncAction } from './useAsyncAction';

type RollCallState = { rollCall: RollCall; board: RollCallBoard; baseline: RollCallBoard };

const fromRollCall = (rollCall: RollCall): RollCallState => ({
  rollCall,
  board: boardFromRollCall(rollCall),
  baseline: savedBaseline(rollCall),
});

export function useRollCall(sessionId: string) {
  const [state, setState] = useState<RollCallState | null>(null);
  const { run: load, isLoading, error } = useAsyncAction(sessionService.getRollCall);
  const { run: save, isLoading: isSaving } = useAsyncAction(sessionService.saveRollCall);

  useEffect(() => {
    load(sessionId).then((result) => result.ok && setState(fromRollCall(result.data)));
  }, [load, sessionId]);

  const change = useCallback((update: (board: RollCallBoard) => RollCallBoard) => {
    setState((current) => current && { ...current, board: update(current.board) });
  }, []);

  const persist = useCallback(async () => {
    if (!state) return null;
    const result = await save(sessionId, toAttendanceRecords(state.board));
    if (result.ok) setState(fromRollCall(result.data));
    return result;
  }, [save, sessionId, state]);

  return {
    rollCall: state?.rollCall ?? null,
    board: state?.board ?? null,
    isDirty: state ? hasChanges(state.board, state.baseline) : false,
    change,
    persist,
    isLoading,
    isSaving,
    error,
  };
}
