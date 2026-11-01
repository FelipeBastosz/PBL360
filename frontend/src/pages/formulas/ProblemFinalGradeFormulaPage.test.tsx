import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { formulaService } from '@/services/formula.service';
import { sessionService } from '@/services/session.service';
import { useAuth } from '@/hooks/useAuth';
import ProblemFinalGradeFormulaPage from './ProblemFinalGradeFormulaPage';

vi.mock('@/services/formula.service');
vi.mock('@/services/session.service');
vi.mock('@/hooks/useAuth');
vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({ notify: vi.fn() }),
}));

const mockFormulaData = {
  padrao: true,
  versao: null,
  sessoes: [
    { sessaoId: 'sess-1', rotulo: 'P1S1', peso: 1 },
    { sessaoId: 'sess-2', rotulo: 'P1S2', peso: 1 },
  ],
};

const mockReleases = {
  autoavaliacao: { liberada: false, prazo: null, enviadas: 0, esperadas: 10 },
  pares: { liberada: false, prazo: null, enviadas: 0, esperadas: 10 },
  atualizadoEm: '2026-01-01',
  atualizadoPor: 'tutor-1',
};

describe('ProblemFinalGradeFormulaPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 'tutor-1', nome: 'Tutor Teste' },
    } as unknown as ReturnType<typeof useAuth>);
    vi.mocked(formulaService.getFinalGrade).mockResolvedValue(mockFormulaData);
    vi.mocked(sessionService.getReleases).mockResolvedValue(mockReleases);
  });

  function renderPage() {
    return render(
      <MemoryRouter initialEntries={['/turmas/room-1/problemas/prob-1/formula']}>
        <Routes>
          <Route
            path="/turmas/:roomId/problemas/:problemId/formula"
            element={<ProblemFinalGradeFormulaPage />}
          />
        </Routes>
      </MemoryRouter>,
    );
  }

  it('renders sessions with labels, evaluation method tags, weights, and simple average badge', async () => {
    renderPage();

    expect(await screen.findByText('P1S1')).toBeInTheDocument();
    expect(screen.getByText('P1S2')).toBeInTheDocument();
    expect(screen.getAllByText('Avaliação do Tutor')).toHaveLength(2);
    expect(screen.getByText('Média simples')).toBeInTheDocument();
    expect(screen.getAllByText('50,0% da nota')).toHaveLength(2);
  });

  it('updates weights and switches badge to weighted average', async () => {
    const user = userEvent.setup();
    renderPage();

    await screen.findByText('P1S1');
    const plusBtn = screen.getByRole('button', { name: 'Aumentar nota de P1S1' });

    await user.click(plusBtn);

    expect(screen.getByText('Média ponderada')).toBeInTheDocument();
    expect(screen.getByText('66,7% da nota')).toBeInTheDocument();
    expect(screen.getByText('33,3% da nota')).toBeInTheDocument();
  });

  it('calls save endpoint with updated weights', async () => {
    const user = userEvent.setup();
    vi.mocked(formulaService.saveFinalGrade).mockResolvedValue(mockFormulaData);
    renderPage();

    await screen.findByText('P1S1');
    await user.click(screen.getByRole('button', { name: 'Salvar fórmula' }));

    expect(formulaService.saveFinalGrade).toHaveBeenCalledWith('room-1', 'prob-1', [
      { sessaoId: 'sess-1', peso: 1 },
      { sessaoId: 'sess-2', peso: 1 },
    ]);
  });

  it('calls restore endpoint and resets weights to default', async () => {
    const user = userEvent.setup();
    vi.mocked(formulaService.restoreDefaultFinalGrade).mockResolvedValue(mockFormulaData);
    renderPage();

    await screen.findByText('P1S1');

    await user.click(screen.getByRole('button', { name: 'Aumentar nota de P1S1' }));
    expect(screen.getByText('Média ponderada')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Restaurar padrão/i }));

    expect(await screen.findByText('Média simples')).toBeInTheDocument();
  });

  it('shows error toast when saving formula fails', async () => {
    const user = userEvent.setup();
    vi.mocked(formulaService.saveFinalGrade).mockRejectedValue(new Error('API Error'));
    renderPage();

    await screen.findByText('P1S1');
    await user.click(screen.getByRole('button', { name: 'Salvar fórmula' }));

    expect(screen.getByRole('button', { name: 'Salvar fórmula' })).toBeInTheDocument();
  });

  it('shows error toast when restoring formula fails', async () => {
    const user = userEvent.setup();
    vi.mocked(formulaService.restoreDefaultFinalGrade).mockRejectedValue(new Error('API Error'));
    renderPage();

    await screen.findByText('P1S1');
    await user.click(screen.getByRole('button', { name: /Restaurar padrão/i }));

    expect(screen.getByRole('button', { name: /Restaurar padrão/i })).toBeInTheDocument();
  });

  it('renders empty state when there are no sessions in the problem', async () => {
    vi.mocked(formulaService.getFinalGrade).mockResolvedValue({
      padrao: true,
      versao: null,
      sessoes: [],
    });

    renderPage();

    expect(
      await screen.findByText('Nenhuma sessão cadastrada para este problema.'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Cadastre sessões para definir os pesos da nota final.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Salvar fórmula' })).not.toBeInTheDocument();
  });
});
