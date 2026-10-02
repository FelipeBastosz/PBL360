import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/services/apiError';
import { performanceTableService } from '@/services/performance-table.service';
import type { PerformanceTableSummary } from '@/types/performanceTable';
import { PerformanceTablesPage } from './PerformanceTablesPage';

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { nome: 'Professor Fulano', tipo: 'TUTOR' } }),
}));

vi.mock('@/services/performance-table.service');

const mockSummaries: PerformanceTableSummary[] = [
  {
    id: 'table-1',
    nome: 'Barema PBL',
    descricao: 'Critérios padrão do módulo.',
    quantidadeCriterios: 6,
    quantidadeProblemas: 2,
    criadoEm: '2026-03-01T10:00:00Z',
    atualizadoEm: '2026-03-01T10:00:00Z',
  },
  {
    id: 'table-2',
    nome: 'Avaliação Curta',
    descricao: null,
    quantidadeCriterios: 3,
    quantidadeProblemas: 0,
    criadoEm: '2026-03-02T10:00:00Z',
    atualizadoEm: '2026-03-02T10:00:00Z',
  },
];

describe('PerformanceTablesPage', () => {
  beforeEach(() => {
    vi.mocked(performanceTableService.list).mockResolvedValue([]);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  function renderPage() {
    return render(
      <MemoryRouter>
        <PerformanceTablesPage />
      </MemoryRouter>,
    );
  }

  it('renders the header correctly with back button', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: 'Fórmulas' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Voltar' })).toBeInTheDocument();
  });

  it('renders the empty state when list is empty', async () => {
    renderPage();

    expect(
      await screen.findByText('Você ainda não possui fórmulas cadastradas.'),
    ).toBeInTheDocument();
    expect(screen.getByText(/Toque no/)).toBeInTheDocument();
  });

  it('renders the list of performance tables and badges when data is returned', async () => {
    vi.mocked(performanceTableService.list).mockResolvedValue(mockSummaries);
    renderPage();

    expect(await screen.findByText('Barema PBL')).toBeInTheDocument();
    expect(screen.getByText('Critérios padrão do módulo.')).toBeInTheDocument();
    expect(screen.getByText('6 critérios')).toBeInTheDocument();

    expect(screen.getByText('Avaliação Curta')).toBeInTheDocument();
    expect(screen.getByText('3 critérios')).toBeInTheDocument();
  });

  it('filters tables based on search query', async () => {
    vi.mocked(performanceTableService.list).mockResolvedValue(mockSummaries);
    renderPage();

    await screen.findByText('Barema PBL');

    const searchInput = screen.getByPlaceholderText('Pesquisar fórmula');
    await userEvent.type(searchInput, 'Curta');

    expect(screen.queryByText('Barema PBL')).not.toBeInTheDocument();
    expect(screen.getByText('Avaliação Curta')).toBeInTheDocument();
  });

  it('shows no results message when filter finds nothing', async () => {
    vi.mocked(performanceTableService.list).mockResolvedValue(mockSummaries);
    renderPage();

    await screen.findByText('Barema PBL');

    const searchInput = screen.getByPlaceholderText('Pesquisar fórmula');
    await userEvent.type(searchInput, 'Inexistente');

    expect(screen.getByText('Nenhuma fórmula encontrada.')).toBeInTheDocument();
  });

  it('displays an error alert when the service fails', async () => {
    vi.mocked(performanceTableService.list).mockRejectedValue(
      new ApiError(500, ['Erro de conexão com o servidor.']),
    );
    renderPage();

    expect(await screen.findByText('Erro de conexão com o servidor.')).toBeInTheDocument();
  });

  it('toggles the fab menu correctly', async () => {
    renderPage();

    const fabButton = screen.getByRole('button', { name: 'Ações de fórmula' });
    expect(screen.queryByText('Criar nova fórmula')).not.toBeInTheDocument();

    await userEvent.click(fabButton);
    expect(screen.getByText('Criar nova fórmula')).toBeInTheDocument();
    expect(screen.getByText('Editar uma fórmula')).toBeInTheDocument();
    expect(screen.getByText('Ordenar fórmulas')).toBeInTheDocument();

    await userEvent.click(fabButton);
    expect(screen.queryByText('Criar nova fórmula')).not.toBeInTheDocument();
  });
});
