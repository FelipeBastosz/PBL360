import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/services/apiError';
import { performanceTableService } from '@/services/performance-table.service';
import { sessionService } from '@/services/session.service';
import type { PerformanceTableSummary } from '@/types/performanceTable';
import { PerformanceTablesPage } from './PerformanceTablesPage';

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { nome: 'Professor Fulano', tipo: 'TUTOR' } }),
}));

vi.mock('@/services/performance-table.service');
vi.mock('@/services/session.service', () => ({
  sessionService: {
    getEvaluationConfig: vi.fn(),
  },
}));

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
    vi.mocked(sessionService.getEvaluationConfig).mockResolvedValue({
      tabela: { id: 'copy-1', nome: 'Barema PBL', padrao: false, criterios: [] },
      formula: { padrao: true, versao: null, componentes: [] },
      bloqueada: false,
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  function renderPage(state = { sessionId: 'sess-1' }) {
    return render(
      <MemoryRouter initialEntries={[{ pathname: '/formulas', state }]}>
        <Routes>
          <Route path="/formulas" element={<PerformanceTablesPage />} />
        </Routes>
      </MemoryRouter>,
    );
  }

  it('renders the header correctly with back button', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: 'Fórmulas' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Voltar' })).toBeInTheDocument();
  });

  it('renders tables with Applied badge when matching session configuration', async () => {
    vi.mocked(performanceTableService.list).mockResolvedValue(mockSummaries);
    renderPage();

    expect(await screen.findByText('Barema PBL')).toBeInTheDocument();
    expect(screen.getByText('Aplicada')).toBeInTheDocument();
  });

  it('filters tables based on search query', async () => {
    vi.mocked(performanceTableService.list).mockResolvedValue(mockSummaries);
    renderPage();

    await screen.findByText('Barema PBL');
    await userEvent.type(screen.getByPlaceholderText('Pesquisar fórmula'), 'Curta');

    expect(screen.queryByText('Barema PBL')).not.toBeInTheDocument();
    expect(screen.getByText('Avaliação Curta')).toBeInTheDocument();
  });

  it('displays an error alert when the service fails', async () => {
    vi.mocked(performanceTableService.list).mockRejectedValue(
      new ApiError(500, ['Erro de conexão com o servidor.']),
    );
    renderPage();

    expect(await screen.findByText('Erro de conexão com o servidor.')).toBeInTheDocument();
  });
});
