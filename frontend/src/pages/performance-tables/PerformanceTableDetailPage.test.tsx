import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/services/apiError';
import { performanceTableService } from '@/services/performance-table.service';
import type { PerformanceTable } from '@/types/performanceTable';
import { PerformanceTableDetailPage } from './PerformanceTableDetailPage';

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { nome: 'Professor Fulano', tipo: 'TUTOR' } }),
}));

vi.mock('@/services/performance-table.service');

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
  function renderPage(id = 'table-1') {
    return render(
      <MemoryRouter initialEntries={[`/formulas/${id}`]}>
        <Routes>
          <Route path="/formulas/:id" element={<PerformanceTableDetailPage />} />
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
});
