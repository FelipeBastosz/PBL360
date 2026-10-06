import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/services/apiError';
import { performanceTableService } from '@/services/performance-table.service';
import { problemService } from '@/services/problem.service';
import type { PerformanceTable } from '@/types/performanceTable';
import { PerformanceTableDetailPage } from './PerformanceTableDetailPage';

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { nome: 'Professor Fulano', tipo: 'TUTOR' } }),
}));

vi.mock('@/services/performance-table.service');
vi.mock('@/services/problem.service', () => ({
  problemService: { changePerformanceTable: vi.fn() },
}));

const mockNotify = vi.fn();
vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({ notify: mockNotify }),
}));

const target = { roomId: 'room-1', problemId: 'problem-1' };

const mockTable: PerformanceTable = {
  id: 'table-1',
  professorId: 'tutor-1',
  nome: 'Sessão de apresentação',
  descricao: 'Formula para sessões com apresentação de resultados e/ou metas',
  quantidadeProblemas: 0,
  criterios: [
    {
      id: 'c1',
      nome: 'Comportamento',
      descricao: 'Comportamente durante a apresentação dos colegas',
      peso: 2,
      ordem: 1,
    },
    {
      id: 'c2',
      nome: 'Domínio',
      descricao: 'Dominio do solução apresentada',
      peso: 5,
      ordem: 2,
    },
    {
      id: 'c3',
      nome: 'Clareza',
      descricao: 'Clareza na explicação das soluções implementadas',
      peso: 3,
      ordem: 3,
    },
  ],
  criadoEm: '2026-03-01T10:00:00Z',
  atualizadoEm: '2026-03-01T10:00:00Z',
};

describe('PerformanceTableDetailPage', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  function renderPage(id = 'table-1', state: unknown = target) {
    return render(
      <MemoryRouter initialEntries={[{ pathname: `/formulas/${id}`, state }]}>
        <Routes>
          <Route path="/formulas/:id" element={<PerformanceTableDetailPage />} />
          <Route path="/turmas/:roomId/problemas/:problemId" element={<p>Página do problema</p>} />
        </Routes>
      </MemoryRouter>,
    );
  }

  it('renders table details with description and criteria list', async () => {
    vi.mocked(performanceTableService.getById).mockResolvedValue(mockTable);
    renderPage();

    expect(
      await screen.findByRole('heading', { name: 'Sessão de apresentação' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Formula para sessões com apresentação de resultados e/ou metas'),
    ).toBeInTheDocument();

    expect(screen.getByText('Comportamento')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();

    expect(screen.getByText('Domínio')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();

    expect(screen.getByText('Clareza')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();

    expect(screen.getByRole('button', { name: 'Aplicar fórmula' })).toBeInTheDocument();
  });

  it('renders error message when fetch fails', async () => {
    vi.mocked(performanceTableService.getById).mockRejectedValue(
      new ApiError(404, ['Tabela de desempenho não encontrada.']),
    );
    renderPage('not-found');

    expect(await screen.findByText('Tabela de desempenho não encontrada.')).toBeInTheDocument();
  });

  it('links the table to the problem the tutor came from', async () => {
    const user = userEvent.setup();
    vi.mocked(performanceTableService.getById).mockResolvedValue(mockTable);
    vi.mocked(problemService.changePerformanceTable).mockResolvedValue({
      problemaId: 'problem-1',
      tabela: { id: 'table-1', nome: 'Sessão de apresentação' },
    });
    renderPage();

    await user.click(await screen.findByRole('button', { name: 'Aplicar fórmula' }));

    expect(problemService.changePerformanceTable).toHaveBeenCalledWith(
      'room-1',
      'problem-1',
      'table-1',
    );
    expect(mockNotify).toHaveBeenCalledWith({
      tone: 'success',
      message: 'Fórmula aplicada ao problema.',
    });
    expect(await screen.findByText('Página do problema')).toBeInTheDocument();
  });

  it('shows the API message when the problem already has sessions', async () => {
    const user = userEvent.setup();
    const message = 'Não é possível alterar a tabela de um problema que já possui avaliações.';
    vi.mocked(performanceTableService.getById).mockResolvedValue(mockTable);
    vi.mocked(problemService.changePerformanceTable).mockRejectedValue(
      new ApiError(409, [message]),
    );
    renderPage();

    await user.click(await screen.findByRole('button', { name: 'Aplicar fórmula' }));

    expect(await screen.findByText(message)).toBeInTheDocument();
    expect(screen.queryByText('Página do problema')).not.toBeInTheDocument();
  });

  it('hides "Aplicar fórmula" when no problem was chosen', async () => {
    vi.mocked(performanceTableService.getById).mockResolvedValue(mockTable);
    renderPage('table-1', null);

    expect(
      await screen.findByRole('heading', { name: 'Sessão de apresentação' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Aplicar fórmula' })).not.toBeInTheDocument();
  });
});
