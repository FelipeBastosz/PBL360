import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { performanceTableService } from '@/services/performance-table.service';
import type { PerformanceTableSummary } from '@/types/performanceTable';
import { ManagePerformanceTablesPage } from './ManagePerformanceTablesPage';

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { nome: 'Professor Fulano', tipo: 'TUTOR' } }),
}));

vi.mock('@/services/performance-table.service');

const mockTables: PerformanceTableSummary[] = [
  {
    id: 't1',
    nome: 'Fórmula Padrão',
    descricao: null,
    quantidadeCriterios: 3,
    quantidadeProblemas: 0,
    criadoEm: '2026-03-01T10:00:00Z',
    atualizadoEm: '2026-03-01T10:00:00Z',
  },
  {
    id: 't2',
    nome: 'Apenas participação',
    descricao: null,
    quantidadeCriterios: 1,
    quantidadeProblemas: 0,
    criadoEm: '2026-03-01T10:00:00Z',
    atualizadoEm: '2026-03-01T10:00:00Z',
  },
];

describe('ManagePerformanceTablesPage', () => {
  beforeEach(() => {
    vi.mocked(performanceTableService.list).mockResolvedValue(mockTables);
  });

  function renderPage() {
    return render(
      <MemoryRouter>
        <ManagePerformanceTablesPage />
      </MemoryRouter>,
    );
  }

  it('renders list of formulas to select', async () => {
    renderPage();

    expect(await screen.findByText('Fórmula Padrão')).toBeInTheDocument();
    expect(screen.getByText('Apenas participação')).toBeInTheDocument();
    expect(screen.getByText('Toque na fórmula que deseja editar.')).toBeInTheDocument();
  });

  it('enables the submit button once a formula is selected', async () => {
    renderPage();

    const submitBtn = await screen.findByRole('button', { name: 'Selecionar fórmula' });
    expect(submitBtn).toBeDisabled();

    await userEvent.click(screen.getByRole('button', { name: 'Fórmula Padrão' }));
    expect(submitBtn).toBeEnabled();
  });

  it('filters formula items by query', async () => {
    renderPage();

    await screen.findByText('Fórmula Padrão');
    await userEvent.type(screen.getByPlaceholderText('Pesquisar fórmula'), 'participação');

    expect(screen.queryByText('Fórmula Padrão')).not.toBeInTheDocument();
    expect(screen.getByText('Apenas participação')).toBeInTheDocument();
  });
});
