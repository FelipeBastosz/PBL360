import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { useAuth } from '@/hooks/useAuth';
import { sessionService } from '@/services/session.service';
import { performanceTableService } from '@/services/performance-table.service';
import SessionFormulasPage from './SessionFormulasPage';

vi.mock('@/hooks/useAuth');
vi.mock('@/services/session.service');
vi.mock('@/services/performance-table.service');
vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({ notify: vi.fn() }),
}));

describe('SessionFormulasPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 'prof-1', nome: 'Professor' },
    } as unknown as ReturnType<typeof useAuth>);
    vi.mocked(performanceTableService.listByRoom).mockResolvedValue([]);
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

  it('renders performance tables tab by default and switches to final score tab', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/turmas/r1/problemas/p1/sessoes/s1/formulas']}>
        <Routes>
          <Route
            path="/turmas/:roomId/problemas/:problemId/sessoes/:sessionId/formulas"
            element={<SessionFormulasPage />}
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole('button', { name: 'Fórmulas de Desempenho' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Fórmula da Nota Final' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Fórmula da Nota Final' }));

    expect(await screen.findByText('Desempenho na Sessão')).toBeInTheDocument();
    expect(screen.getByText('Desempenho no Cargo')).toBeInTheDocument();
    expect(screen.getByDisplayValue('7,0')).toBeInTheDocument();
    expect(screen.getByDisplayValue('3,0')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Salvar fórmula' })).toBeInTheDocument();
  });

  it('adjusts the other weight automatically when one weight is changed so the sum is always 10', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/turmas/r1/problemas/p1/sessoes/s1/formulas']}>
        <Routes>
          <Route
            path="/turmas/:roomId/problemas/:problemId/sessoes/:sessionId/formulas"
            element={<SessionFormulasPage />}
          />
        </Routes>
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: 'Fórmula da Nota Final' }));
    expect(await screen.findByDisplayValue('7,0')).toBeInTheDocument();
    expect(screen.getByDisplayValue('3,0')).toBeInTheDocument();
    expect(screen.queryByText('Soma dos pesos')).not.toBeInTheDocument();
    expect(screen.getByText(/Ajuste automático/i)).toBeInTheDocument();

    // Increase Desempenho na Sessão from 7.0 to 8.0
    await user.click(screen.getByRole('button', { name: 'Aumentar nota de Desempenho na Sessão' }));

    expect(screen.getByDisplayValue('8,0')).toBeInTheDocument();
    expect(screen.getByDisplayValue('2,0')).toBeInTheDocument();

    // Increase Desempenho no Cargo from 2.0 to 3.0
    await user.click(screen.getByRole('button', { name: 'Aumentar nota de Desempenho no Cargo' }));

    expect(screen.getByDisplayValue('7,0')).toBeInTheDocument();
    expect(screen.getByDisplayValue('3,0')).toBeInTheDocument();

    // Decrease Desempenho na Sessão from 7.0 to 6.0
    await user.click(screen.getByRole('button', { name: 'Diminuir nota de Desempenho na Sessão' }));

    expect(screen.getByDisplayValue('6,0')).toBeInTheDocument();
    expect(screen.getByDisplayValue('4,0')).toBeInTheDocument();
  });

  it('does not allow weights below 1,0 and disables decrease button at 1,0', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/turmas/r1/problemas/p1/sessoes/s1/formulas']}>
        <Routes>
          <Route
            path="/turmas/:roomId/problemas/:problemId/sessoes/:sessionId/formulas"
            element={<SessionFormulasPage />}
          />
        </Routes>
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: 'Fórmula da Nota Final' }));
    expect(await screen.findByDisplayValue('7,0')).toBeInTheDocument();
    expect(screen.getByDisplayValue('3,0')).toBeInTheDocument();

    const decreaseCargoBtn = screen.getByRole('button', {
      name: 'Diminuir nota de Desempenho no Cargo',
    });
    await user.click(decreaseCargoBtn);
    expect(screen.getByDisplayValue('2,0')).toBeInTheDocument();
    expect(screen.getByDisplayValue('8,0')).toBeInTheDocument();

    await user.click(decreaseCargoBtn);
    expect(screen.getByDisplayValue('1,0')).toBeInTheDocument();
    expect(screen.getByDisplayValue('9,0')).toBeInTheDocument();

    expect(decreaseCargoBtn).toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'Aumentar nota de Desempenho na Sessão' }),
    ).toBeDisabled();
  });
});
