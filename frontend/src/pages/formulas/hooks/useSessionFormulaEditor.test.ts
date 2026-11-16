import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { sessionService } from '@/services/session.service';
import { useSessionFormulaEditor } from './useSessionFormulaEditor';

vi.mock('@/services/session.service');
vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({ notify: vi.fn() }),
}));

describe('useSessionFormulaEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(sessionService.getEvaluationConfig).mockResolvedValue({
      tabela: { id: 't-1', nome: 'Tabela Padrão', padrao: true, criterios: [] },
      formula: {
        padrao: true,
        versao: null,
        componentes: [
          { tipo: 'CRITERIOS', peso: 70 },
          { tipo: 'PAPEL', peso: 30 },
        ],
      },
      bloqueada: false,
    });
  });

  it('loads weights and initializes with sum equal to 10', async () => {
    const { result } = renderHook(() => useSessionFormulaEditor('session-1'));

    await waitFor(() => {
      expect(result.current.sessionWeight).toBe(7.0);
      expect(result.current.roleWeight).toBe(3.0);
    });

    expect(result.current.totalSum).toBe(10.0);
    expect(result.current.isBalanced).toBe(true);
  });

  it('automatically adjusts role weight when session weight is changed', async () => {
    const { result } = renderHook(() => useSessionFormulaEditor('session-1'));

    await waitFor(() => {
      expect(result.current.sessionWeight).toBe(7.0);
    });

    act(() => {
      result.current.setSessionWeight(8.0);
    });

    expect(result.current.sessionWeight).toBe(8.0);
    expect(result.current.roleWeight).toBe(2.0);
    expect(result.current.totalSum).toBe(10.0);
    expect(result.current.isBalanced).toBe(true);
  });

  it('automatically adjusts session weight when role weight is changed', async () => {
    const { result } = renderHook(() => useSessionFormulaEditor('session-1'));

    await waitFor(() => {
      expect(result.current.roleWeight).toBe(3.0);
    });

    act(() => {
      result.current.setRoleWeight(4.5);
    });

    expect(result.current.roleWeight).toBe(4.5);
    expect(result.current.sessionWeight).toBe(5.5);
    expect(result.current.totalSum).toBe(10.0);
    expect(result.current.isBalanced).toBe(true);
  });

  it('clamps values to [1, 9] (minimum 1,0) and keeps sum equal to 10', async () => {
    const { result } = renderHook(() => useSessionFormulaEditor('session-1'));

    await waitFor(() => {
      expect(result.current.sessionWeight).toBe(7.0);
    });

    act(() => {
      result.current.setSessionWeight(12);
    });

    expect(result.current.sessionWeight).toBe(9.0);
    expect(result.current.roleWeight).toBe(1.0);
    expect(result.current.totalSum).toBe(10.0);

    act(() => {
      result.current.setSessionWeight(0);
    });

    expect(result.current.sessionWeight).toBe(1.0);
    expect(result.current.roleWeight).toBe(9.0);
    expect(result.current.totalSum).toBe(10.0);

    act(() => {
      result.current.setRoleWeight(15);
    });

    expect(result.current.roleWeight).toBe(9.0);
    expect(result.current.sessionWeight).toBe(1.0);
    expect(result.current.totalSum).toBe(10.0);

    act(() => {
      result.current.setRoleWeight(0);
    });

    expect(result.current.roleWeight).toBe(1.0);
    expect(result.current.sessionWeight).toBe(9.0);
    expect(result.current.totalSum).toBe(10.0);
  });

  it('sends updated weights in payload when saving', async () => {
    vi.mocked(sessionService.updateFormula).mockResolvedValue({
      sucesso: true,
      componentes: [
        { tipo: 'CRITERIOS', peso: 80 },
        { tipo: 'PAPEL', peso: 20 },
      ],
    } as unknown as Awaited<ReturnType<typeof sessionService.updateFormula>>);

    const { result } = renderHook(() => useSessionFormulaEditor('session-1'));

    await waitFor(() => {
      expect(result.current.sessionWeight).toBe(7.0);
    });

    act(() => {
      result.current.setSessionWeight(8.0);
    });

    let ok = false;
    await act(async () => {
      ok = await result.current.save(false);
    });

    expect(ok).toBe(true);
    expect(sessionService.updateFormula).toHaveBeenCalledWith('session-1', {
      componentes: [
        { tipo: 'CRITERIOS', peso: 80 },
        { tipo: 'PAPEL', peso: 20 },
      ],
      aplicarNasSeguintes: false,
    });
  });
});
