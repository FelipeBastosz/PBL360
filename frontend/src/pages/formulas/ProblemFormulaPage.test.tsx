import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthContext } from '@/contexts/authContext';
import { ToastProvider } from '@/contexts/ToastProvider';
import { ApiError } from '@/services/apiError';
import { formulaService } from '@/services/formula.service';
import { performanceTableService } from '@/services/performance-table.service';
import { problemService } from '@/services/problem.service';
import type { UserResponse } from '@/types/auth';
import type { Formula } from '@/types/formula';
import type { PerformanceTable } from '@/types/performanceTable';
import type { Problem } from '@/types/problem';
import ProblemFormulaPage from './ProblemFormulaPage';

vi.mock('@/services/formula.service', () => ({
  formulaService: { get: vi.fn(), save: vi.fn(), restoreDefault: vi.fn() },
}));
vi.mock('@/services/problem.service', () => ({ problemService: { getById: vi.fn() } }));
vi.mock('@/services/performance-table.service', () => ({
  performanceTableService: { getById: vi.fn() },
}));
vi.mock('@/services/user.service', () => ({ userService: { getPhoto: vi.fn() } }));

const tutor: UserResponse = {
  id: 't1',
  nome: 'Paula Freitas',
  email: 'paula@uefs.br',
  tipo: 'PROFESSOR',
  matricula: null,
  possuiFoto: false,
  ativo: true,
  criadoEm: '2026-01-01',
};

const sessionFormula: Formula = {
  escopo: 'SESSAO',
  padrao: true,
  versao: null,
  componentes: [
    { tipo: 'CRITERIO', referenciaId: 'c1', nome: 'Seguimento', peso: 30 },
    { tipo: 'CRITERIO', referenciaId: 'c2', nome: 'Participação', peso: 70 },
  ],
};

const finalFormula: Formula = {
  escopo: 'PROBLEMA',
  padrao: true,
  versao: null,
  componentes: [
    { tipo: 'MEDIA_SESSOES', referenciaId: null, nome: 'Média das Sessões', peso: 100 },
  ],
};

const BASE = '/turmas/room-1/problemas/problem-1/sessoes/session-1';

function renderPage(user: UserResponse = tutor) {
  return render(
    <ToastProvider>
      <AuthContext.Provider
        value={{ user, isAuthenticated: true, login: vi.fn(), logout: vi.fn() }}
      >
        <MemoryRouter initialEntries={[`${BASE}/formulas`]}>
          <Routes>
            <Route
              path="/turmas/:roomId/problemas/:problemId/sessoes/:sessionId/formulas"
              element={<ProblemFormulaPage />}
            />
            <Route
              path="/turmas/:roomId/problemas/:problemId/sessoes/:sessionId"
              element={<p>Sessão</p>}
            />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    </ToastProvider>,
  );
}

const sessionPanel = () => screen.getByRole('tabpanel', { name: 'Nota de Sessão' });

describe('ProblemFormulaPage', () => {
  beforeEach(() => {
    vi.mocked(formulaService.get).mockImplementation(async (_room, _problem, scope) =>
      scope === 'SESSAO' ? sessionFormula : finalFormula,
    );
    vi.mocked(problemService.getById).mockResolvedValue({ tabelaId: 'table-1' } as Problem);
    vi.mocked(performanceTableService.getById).mockResolvedValue({
      criterios: [
        { id: 'c1', nome: 'Seguimento' },
        { id: 'c2', nome: 'Participação' },
        { id: 'c3', nome: 'Comportamento' },
      ],
    } as PerformanceTable);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('shows the weight of each criterion of the session formula and their sum', async () => {
    renderPage();

    expect(await screen.findByRole('slider', { name: /Seguimento/ })).toHaveValue('30');
    expect(screen.getByRole('slider', { name: /Participação/ })).toHaveValue('70');
    expect(within(sessionPanel()).getByText('Soma dos pesos').parentElement).toHaveTextContent(
      '100%',
    );
    expect(formulaService.get).toHaveBeenCalledWith('room-1', 'problem-1', 'SESSAO');
  });

  it('blocks saving until the weights add up to 100% and then saves them', async () => {
    const user = userEvent.setup();
    vi.mocked(formulaService.save).mockResolvedValue({
      ...sessionFormula,
      padrao: false,
      versao: 1,
    });
    renderPage();
    const seguimento = await screen.findByRole('slider', { name: /Seguimento/ });
    const save = within(sessionPanel()).getByRole('button', { name: 'Salvar fórmula' });

    fireEvent.change(seguimento, { target: { value: '40' } });
    expect(save).toBeDisabled();
    expect(
      within(sessionPanel()).getByText('A soma dos pesos precisa ser 100%.'),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByRole('slider', { name: /Participação/ }), {
      target: { value: '60' },
    });
    await user.click(save);

    expect(formulaService.save).toHaveBeenCalledWith('room-1', 'problem-1', 'SESSAO', [
      { tipo: 'CRITERIO', referenciaId: 'c1', nome: 'Seguimento', peso: 40 },
      { tipo: 'CRITERIO', referenciaId: 'c2', nome: 'Participação', peso: 60 },
    ]);
    expect(
      await screen.findByText('Fórmula salva. Ela vale para todas as sessões deste problema.'),
    ).toBeInTheDocument();
  });

  it('adds a criterion of the problem table that is not in the formula', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByRole('slider', { name: /Seguimento/ });

    await user.click(
      within(sessionPanel()).getByRole('button', { name: 'Adicionar novo critério' }),
    );
    await user.click(await screen.findByRole('button', { name: 'Comportamento' }));

    expect(screen.getByRole('slider', { name: /Comportamento/ })).toHaveValue('0');
  });

  it('restores the default formula', async () => {
    const user = userEvent.setup();
    vi.mocked(formulaService.restoreDefault).mockResolvedValue(sessionFormula);
    renderPage();
    await screen.findByRole('slider', { name: /Seguimento/ });

    await user.click(within(sessionPanel()).getByRole('button', { name: 'Restaurar padrão' }));

    expect(formulaService.restoreDefault).toHaveBeenCalledWith('room-1', 'problem-1', 'SESSAO');
    expect(await screen.findByText('Fórmula padrão restaurada.')).toBeInTheDocument();
  });

  it('switches to the final grade formula', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByRole('slider', { name: /Seguimento/ });

    await user.click(screen.getByRole('tab', { name: 'Nota Final' }));

    expect(screen.getByRole('tab', { name: 'Nota Final' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByRole('slider', { name: /Média das Sessões/ })).toHaveValue('100');
    expect(screen.queryByRole('slider', { name: /Seguimento/ })).not.toBeInTheDocument();
  });

  it('shows the API message when the problem has no performance table', async () => {
    vi.mocked(formulaService.get).mockImplementation(async (_room, _problem, scope) => {
      if (scope === 'PROBLEMA') return finalFormula;
      throw new ApiError(422, ['O problema não possui uma tabela de desempenho com critérios.']);
    });
    renderPage();

    expect(
      await screen.findByText('O problema não possui uma tabela de desempenho com critérios.'),
    ).toBeInTheDocument();
  });

  it('goes back to the session', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByRole('slider', { name: /Seguimento/ });

    await user.click(screen.getByRole('link', { name: 'Voltar para a sessão' }));

    expect(screen.getByText('Sessão')).toBeInTheDocument();
  });

  it('sends students back to the session', async () => {
    renderPage({ ...tutor, tipo: 'ALUNO' });

    expect(await screen.findByText('Sessão')).toBeInTheDocument();
    expect(formulaService.get).not.toHaveBeenCalled();
  });
});
