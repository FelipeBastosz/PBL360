import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { performanceTableService } from '@/services/performance-table.service';
import { sessionService } from '@/services/session.service';
import type { PerformanceTable } from '@/types/performanceTable';
import { EditPerformanceTablePage } from './EditPerformanceTablePage';

const mockNotify = vi.fn();
vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({ notify: mockNotify }),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { nome: 'Professor Fulano', tipo: 'TUTOR' } }),
}));

vi.mock('@/services/performance-table.service');
vi.mock('@/services/session.service', () => ({
  sessionService: {
    getTableEditPermissions: vi.fn(),
    editSessionTable: vi.fn(),
  },
}));

const mockTable: PerformanceTable = {
  id: 'table-1',
  professorId: 'tutor-1',
  nome: 'Sessão de apresentação',
  descricao: 'Formula para sessões com apresentação de resultados e/ou metas',
  quantidadeProblemas: 0,
  criterios: [
    { id: 'c1', nome: 'Comportamento', descricao: 'Comportamento dos colegas', peso: 5, ordem: 1 },
    { id: 'c2', nome: 'Domínio', descricao: 'Domínio da solução', peso: 5, ordem: 2 },
  ],
  criadoEm: '2026-03-01T10:00:00Z',
  atualizadoEm: '2026-03-01T10:00:00Z',
};

describe('EditPerformanceTablePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(performanceTableService.getById).mockResolvedValue(mockTable);
  });

  function renderPage(id = 'table-1') {
    return render(
      <MemoryRouter initialEntries={[`/formulas/${id}/editar`]}>
        <Routes>
          <Route path="/formulas/:id/editar" element={<EditPerformanceTablePage />} />
        </Routes>
      </MemoryRouter>,
    );
  }

  it('renders table details and criteria for editing', async () => {
    renderPage();

    expect(
      await screen.findByRole('heading', { name: 'Sessão de apresentação' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Comportamento')).toBeInTheDocument();
    expect(screen.getByText('Domínio')).toBeInTheDocument();
  });

  it('prompts user with warning modal before saving formula alterations', async () => {
    vi.mocked(performanceTableService.update).mockResolvedValue(mockTable);
    renderPage();

    await screen.findByRole('heading', { name: 'Sessão de apresentação' });
    await userEvent.click(screen.getByRole('button', { name: 'Concluir edição' }));

    expect(screen.getByText('Salvar alterações na fórmula?')).toBeInTheDocument();
    expect(screen.getByText(/sessões que já foram avaliadas com esta fórmula/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Confirmar e salvar' }));

    expect(performanceTableService.update).toHaveBeenCalledWith(
      'table-1',
      expect.objectContaining({ nome: 'Sessão de apresentação' }),
    );
    expect(mockNotify).toHaveBeenCalledWith({
      tone: 'success',
      message: 'Fórmula atualizada com sucesso.',
    });
  });

  it('opens modal to delete a criterion and removes it when confirmed', async () => {
    renderPage();

    await screen.findByRole('heading', { name: 'Sessão de apresentação' });
    await userEvent.click(screen.getByRole('button', { name: 'Excluir critério Comportamento' }));

    expect(screen.getByText('Excluir critério?')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Sim, excluir critério' }));

    expect(screen.queryByText('Comportamento')).not.toBeInTheDocument();
    expect(screen.getByText('Domínio')).toBeInTheDocument();
  });

  it('opens modal to delete the entire formula and deletes via service', async () => {
    vi.mocked(performanceTableService.remove).mockResolvedValue();
    renderPage();

    await screen.findByRole('heading', { name: 'Sessão de apresentação' });
    await userEvent.click(screen.getByRole('button', { name: 'Excluir essa fórmula' }));

    expect(screen.getByText('Excluir fórmula?')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Sim, excluir fórmula' }));

    expect(performanceTableService.remove).toHaveBeenCalledWith('table-1');
    expect(mockNotify).toHaveBeenCalledWith({
      tone: 'success',
      message: 'Fórmula excluída com sucesso.',
    });
  });

  describe('Session table editing flow (MEL05.2)', () => {
    const sessionTarget = {
      roomId: 'room-1',
      problemId: 'prob-1',
      sessionId: 'sess-1',
    };

    it('renders locked mode when table was already used in occurred sessions (only weights editable)', async () => {
      vi.mocked(sessionService.getTableEditPermissions).mockResolvedValue({
        podeEditarCriterios: false,
        motivo: 'Esta tabela já foi usada em sessões que aconteceram',
        sessoesQueUsam: [
          { sessaoId: 'sess-1', rotulo: 'P1S1', jaAconteceu: true },
          { sessaoId: 'sess-2', rotulo: 'P1S2', jaAconteceu: false },
        ],
      });

      render(
        <MemoryRouter
          initialEntries={[{ pathname: '/formulas/table-1/editar', state: sessionTarget }]}
        >
          <Routes>
            <Route path="/formulas/:id/editar" element={<EditPerformanceTablePage />} />
          </Routes>
        </MemoryRouter>,
      );

      expect(
        await screen.findByText('Esta tabela já foi usada em sessões que aconteceram'),
      ).toBeInTheDocument();

      // Name & description editing button should NOT be rendered
      expect(
        screen.queryByRole('button', { name: 'Editar descrição e título' }),
      ).not.toBeInTheDocument();

      // Add criterion button should NOT be rendered
      expect(screen.queryByRole('button', { name: '+Adicionar critério' })).not.toBeInTheDocument();

      // Delete criterion button should NOT be rendered
      expect(
        screen.queryByRole('button', { name: 'Excluir critério Comportamento' }),
      ).not.toBeInTheDocument();

      // Delete whole formula button should NOT be rendered when editing from session
      expect(
        screen.queryByRole('button', { name: 'Excluir essa fórmula' }),
      ).not.toBeInTheDocument();

      // Edit criterion opens modal with disabled name and description
      await userEvent.click(screen.getByRole('button', { name: 'Editar critério Comportamento' }));
      expect(screen.getByLabelText('Nome do Critério')).toBeDisabled();
      expect(screen.getByLabelText('Descrição do Critério')).toBeDisabled();
      expect(screen.getByLabelText('Peso')).toBeEnabled();
    });

    it('renders full editing mode when permitted and prompts with scope modal on save', async () => {
      vi.mocked(sessionService.getTableEditPermissions).mockResolvedValue({
        podeEditarCriterios: true,
        motivo: null,
        sessoesQueUsam: [
          { sessaoId: 'sess-1', rotulo: 'P1S1', jaAconteceu: false },
          { sessaoId: 'sess-2', rotulo: 'P1S2', jaAconteceu: false },
        ],
      });
      vi.mocked(sessionService.editSessionTable).mockResolvedValue({
        tabela: { id: 'copy-1', nome: 'Sessão de apresentação — P1S1' },
        sessoesAtualizadas: [{ sessaoId: 'sess-1', rotulo: 'P1S1' }],
      });

      render(
        <MemoryRouter
          initialEntries={[{ pathname: '/formulas/table-1/editar', state: sessionTarget }]}
        >
          <Routes>
            <Route path="/formulas/:id/editar" element={<EditPerformanceTablePage />} />
            <Route path="/formulas" element={<div>Lista de Fórmulas</div>} />
          </Routes>
        </MemoryRouter>,
      );

      await screen.findByRole('heading', { name: 'Sessão de apresentação' });

      // Elements enabled in full mode
      expect(screen.getByRole('button', { name: 'Editar descrição e título' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '+Adicionar critério' })).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Excluir critério Comportamento' }),
      ).toBeInTheDocument();

      // Click to conclude editing
      await userEvent.click(screen.getByRole('button', { name: 'Concluir edição' }));

      // EditScopeModal should appear
      expect(
        screen.getByRole('heading', { name: 'Onde aplicar as alterações?' }),
      ).toBeInTheDocument();
      expect(screen.getByLabelText(/Aplicar só nesta sessão/i)).toBeInTheDocument();
      expect(
        screen.getByLabelText(/Em todas as 2 sessões que usam esta tabela/i),
      ).toBeInTheDocument();
      expect(screen.getByText('P1S1')).toBeInTheDocument();
      expect(screen.getByText('P1S2')).toBeInTheDocument();

      // Confirm with default SESSAO scope
      await userEvent.click(screen.getByRole('button', { name: 'Confirmar e salvar' }));

      expect(sessionService.editSessionTable).toHaveBeenCalledWith('sess-1', {
        escopo: 'SESSAO',
        nome: 'Sessão de apresentação',
        criterios: [
          { id: 'c1', nome: 'Comportamento', peso: 5 },
          { id: 'c2', nome: 'Domínio', peso: 5 },
        ],
      });
      expect(mockNotify).toHaveBeenCalledWith({
        tone: 'success',
        message: 'Fórmula da sessão atualizada com sucesso.',
      });
    });

    it('submits with TODAS scope when selected in the scope modal', async () => {
      vi.mocked(sessionService.getTableEditPermissions).mockResolvedValue({
        podeEditarCriterios: true,
        motivo: null,
        sessoesQueUsam: [
          { sessaoId: 'sess-1', rotulo: 'P1S1', jaAconteceu: false },
          { sessaoId: 'sess-2', rotulo: 'P1S2', jaAconteceu: false },
        ],
      });
      vi.mocked(sessionService.editSessionTable).mockResolvedValue({
        tabela: { id: 'table-1', nome: 'Sessão de apresentação' },
        sessoesAtualizadas: [
          { sessaoId: 'sess-1', rotulo: 'P1S1' },
          { sessaoId: 'sess-2', rotulo: 'P1S2' },
        ],
      });

      render(
        <MemoryRouter
          initialEntries={[{ pathname: '/formulas/table-1/editar', state: sessionTarget }]}
        >
          <Routes>
            <Route path="/formulas/:id/editar" element={<EditPerformanceTablePage />} />
          </Routes>
        </MemoryRouter>,
      );

      await screen.findByRole('heading', { name: 'Sessão de apresentação' });
      await userEvent.click(screen.getByRole('button', { name: 'Concluir edição' }));

      await userEvent.click(screen.getByLabelText(/Em todas as 2 sessões/i));
      await userEvent.click(screen.getByRole('button', { name: 'Confirmar e salvar' }));

      expect(sessionService.editSessionTable).toHaveBeenCalledWith(
        'sess-1',
        expect.objectContaining({ escopo: 'TODAS' }),
      );
    });
  });
});
