import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { performanceTableService } from '@/services/performance-table.service';
import { sessionService } from '@/services/session.service';
import { useAuth } from '@/hooks/useAuth';
import type { PerformanceTable } from '@/types/performanceTable';
import PerformanceTableDetailPage from './PerformanceTableDetailPage';

vi.mock('@/hooks/useAuth');
vi.mock('@/services/performance-table.service');
vi.mock('@/services/session.service', () => ({
  sessionService: {
    applyTable: vi.fn(),
    getEvaluationConfig: vi.fn(),
  },
}));

const mockNotify = vi.fn();
vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({ notify: mockNotify }),
}));

const target = { roomId: 'room-1', problemId: 'problem-1', sessionId: 'sess-1' };

const mockTable: PerformanceTable = {
  id: 'table-1',
  professorId: 'tutor-1',
  nome: 'Barema PBL',
  descricao: 'Descrição do barema',
  quantidadeProblemas: 0,
  autor: { id: 'tutor-1', nome: 'Professor Titular' },
  criterios: [
    { id: 'c1', nome: 'Comportamento', descricao: '', peso: 5, ordem: 1 },
    { id: 'c2', nome: 'Domínio', descricao: '', peso: 5, ordem: 2 },
  ],
  criadoEm: '2026-03-01T10:00:00Z',
  atualizadoEm: '2026-03-01T10:00:00Z',
};

describe('PerformanceTableDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 'tutor-1', nome: 'Professor Titular', tipo: 'TUTOR' },
    } as unknown as ReturnType<typeof useAuth>);
    vi.mocked(performanceTableService.getById).mockResolvedValue(mockTable);
    vi.mocked(sessionService.getEvaluationConfig).mockResolvedValue({
      tabela: { id: 'other', nome: 'Outra Tabela', padrao: false, criterios: [] },
      formula: { padrao: true, versao: null, componentes: [] },
      bloqueada: false,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  function renderPage(id = 'table-1', state: unknown = target) {
    return render(
      <MemoryRouter initialEntries={[{ pathname: `/formulas/${id}`, state }]}>
        <Routes>
          <Route path="/formulas/:id" element={<PerformanceTableDetailPage />} />
          <Route
            path="/turmas/:roomId/problemas/:problemId/sessoes/:sessionId"
            element={<p>Hub da Sessão</p>}
          />
        </Routes>
      </MemoryRouter>,
    );
  }

  it('renders table details and apply button', async () => {
    renderPage();
    expect(await screen.findByRole('heading', { name: 'Barema PBL' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Aplicar fórmula' })).toBeInTheDocument();
  });

  it('opens confirmation modal and applies to this session only', async () => {
    const user = userEvent.setup();
    vi.mocked(sessionService.applyTable).mockResolvedValue({
      sessoesAtualizadas: [{ sessaoId: 'sess-1', rotulo: 'Sessão 1' }],
      sessoesIgnoradas: [],
    });

    renderPage();
    await user.click(await screen.findByRole('button', { name: 'Aplicar fórmula' }));

    expect(screen.getByText(/substituir tabela/i)).toBeInTheDocument();
    expect(screen.getByText(/esta sessão já possui a tabela/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /confirmar substituição/i }));

    expect(sessionService.applyTable).toHaveBeenCalledWith('sess-1', {
      tabelaId: 'table-1',
      aplicarNasSeguintes: false,
    });
  });

  it('disables apply button and shows message when table is already applied', async () => {
    vi.mocked(sessionService.getEvaluationConfig).mockResolvedValue({
      tabela: { id: 'table-1', nome: 'Barema PBL', padrao: false, criterios: [] },
      formula: { padrao: true, versao: null, componentes: [] },
      bloqueada: false,
    });

    renderPage();
    expect(
      await screen.findByText('Esta fórmula já está aplicada a esta sessão.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Aplicar fórmula' })).not.toBeInTheDocument();
  });

  it('shows lock message and disables apply button when session has submitted evaluations', async () => {
    vi.mocked(sessionService.getEvaluationConfig).mockResolvedValue({
      tabela: { id: 'other', nome: 'Outra', padrao: false, criterios: [] },
      formula: { padrao: true, versao: null, componentes: [] },
      bloqueada: true,
    });

    renderPage();
    expect(
      await screen.findByText(/esta sessão já possui avaliações enviadas/i),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Aplicar fórmula' })).toBeDisabled();
  });

  describe('when accessed by a co-tutor', () => {
    beforeEach(() => {
      // Simula perfil de co-tutor (ID diferente do criador da tabela tutor-1)
      vi.mocked(useAuth).mockReturnValue({
        user: { id: 'co-tutor-99', nome: 'Professora Co-tutora', tipo: 'TUTOR' },
      } as unknown as ReturnType<typeof useAuth>);
    });

    it('loads shared formula with criteria and displays shared informative banner', async () => {
      renderPage();

      expect(await screen.findByRole('heading', { name: 'Barema PBL' })).toBeInTheDocument();
      expect(screen.getByText('Comportamento')).toBeInTheDocument();
      expect(screen.getByText('Domínio')).toBeInTheDocument();
      expect(
        screen.getByText(/Fórmula compartilhada da turma · Criada por Professor Titular/i),
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Aplicar fórmula' })).toBeInTheDocument();
    });
  });
});
