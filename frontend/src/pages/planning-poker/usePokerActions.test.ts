import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { planningPokerService } from '@/services/planningPoker.service';
import { usePokerActions } from './usePokerActions';

const notify = vi.fn();

vi.mock('@/hooks/useToast', () => ({ useToast: () => ({ notify }) }));

vi.mock('@/services/planningPoker.service', () => ({
  planningPokerService: { decide: vi.fn() },
}));

describe('usePokerActions', () => {
  const refresh = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('confirms the adjusted grade and refreshes the round after the API accepts it', async () => {
    vi.mocked(planningPokerService.decide).mockResolvedValue(undefined as never);
    const { result } = renderHook(() => usePokerActions('sess-1', refresh));

    let ok = false;
    await act(async () => {
      ok = await result.current.adjust('rodada-1', 8.5, 'Conduziu a síntese.');
    });

    expect(ok).toBe(true);
    expect(planningPokerService.decide).toHaveBeenCalledWith('sess-1', 'rodada-1', {
      acao: 'REAJUSTAR',
      nota: 8.5,
      justificativa: 'Conduziu a síntese.',
    });
    expect(notify).toHaveBeenCalledWith({ tone: 'success', message: 'Nota reajustada.' });
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(result.current.isBusy).toBe(false);
  });

  it('confirms the accepted average and refreshes the round', async () => {
    vi.mocked(planningPokerService.decide).mockResolvedValue(undefined as never);
    const { result } = renderHook(() => usePokerActions('sess-1', refresh));

    await act(async () => {
      await result.current.accept('rodada-1');
    });

    expect(planningPokerService.decide).toHaveBeenCalledWith('sess-1', 'rodada-1', {
      acao: 'ACEITAR',
    });
    expect(notify).toHaveBeenCalledWith({ tone: 'success', message: 'Média aceita.' });
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it('shows the API error and keeps the round as it was when the decision fails', async () => {
    vi.mocked(planningPokerService.decide).mockRejectedValue(new Error('Rodada já decidida.'));
    const { result } = renderHook(() => usePokerActions('sess-1', refresh));

    let ok = true;
    await act(async () => {
      ok = await result.current.accept('rodada-1');
    });

    expect(ok).toBe(false);
    expect(notify).toHaveBeenCalledWith(expect.objectContaining({ tone: 'error' }));
    expect(refresh).not.toHaveBeenCalled();
  });
});
