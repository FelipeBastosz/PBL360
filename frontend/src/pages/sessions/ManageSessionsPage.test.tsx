import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type * as Router from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { problemService } from '@/services/problem.service';
import { sessionService } from '@/services/session.service';
import { ApiError } from '@/services/apiError';
import type { Problem } from '@/types/problem';
import type { Session } from '@/types/session';
import ManageSessionsPage from './ManageSessionsPage';

vi.mock('@/services/problem.service', () => ({
  problemService: {
    getById: vi.fn(),
  },
}));

vi.mock('@/services/session.service', () => ({
  sessionService: {
    list: vi.fn(),
    getDeletionImpact: vi.fn(),
    remove: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { nome: 'Professor Silva' },
  }),
}));

const mockNotify = vi.fn();
vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({
    notify: mockNotify,
  }),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof Router>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockProblem: Problem = {
  id: 'prob-1',
  salaId: 'room-1',
  titulo: 'Problema 01',
  descricao: null,
  ordem: 1,
  dataInicio: null,
  dataFim: null,
  tabelaId: null,
  autoavaliacaoLiberada: false,
  avaliacaoEntreParesLiberada: false,
  liberadoEm: null,
  prazoAutoavaliacao: null,
  criadoPor: 'tutor-1',
  criadoEm: '2026-01-01',
  atualizadoEm: '2026-01-01',
};

const mockSessions: Session[] = [
  {
    id: 'sess-1',
    titulo: 'Sessão 1',
    descricao: 'Primeira sessão',
    data: '15-10-2026',
    ordem: 1,
    status: 'agendada',
  },
];

describe('ManageSessionsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(problemService.getById).mockResolvedValue(mockProblem);
    vi.mocked(sessionService.list).mockResolvedValue(mockSessions);
    vi.mocked(sessionService.getDeletionImpact).mockResolvedValue({
      podeExcluir: true,
      papeis: 2,
      chamada: 10,
      avaliacoes: 4,
      observacoes: 0,
      feedbacks: 0,
    });
  });

  const renderComponent = () => {
    return render(
      <MemoryRouter initialEntries={['/turmas/room-1/problemas/prob-1/sessoes/gerenciar']}>
        <Routes>
          <Route
            path="/turmas/:roomId/problemas/:problemId/sessoes/gerenciar"
            element={<ManageSessionsPage />}
          />
        </Routes>
      </MemoryRouter>,
    );
  };

  it('renders session list with edit and delete buttons, and footer', async () => {
    renderComponent();

    expect(await screen.findByText('Sessão 1')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Editar Sessão 1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Excluir Sessão 1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Concluir edição' })).toBeInTheDocument();
  });

  it('opens edit modal when pencil icon is clicked', async () => {
    const user = userEvent.setup();
    renderComponent();

    const editBtn = await screen.findByRole('button', { name: 'Editar Sessão 1' });
    await user.click(editBtn);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Editar Sessão' })).toBeInTheDocument();
  });

  it('opens deletion modal with impact data and deletes session on confirmation', async () => {
    const user = userEvent.setup();
    vi.mocked(sessionService.remove).mockResolvedValue(undefined);

    renderComponent();

    const deleteBtn = await screen.findByRole('button', { name: 'Excluir Sessão 1' });
    await user.click(deleteBtn);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Excluir sessão?' })).toBeInTheDocument();
    expect(screen.getByText(/2 papéis atribuídos/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Sim, excluir sessão' }));

    await waitFor(() => {
      expect(sessionService.remove).toHaveBeenCalledWith('room-1', 'prob-1', 'sess-1');
      expect(screen.queryByText('Sessão 1')).not.toBeInTheDocument();
      expect(mockNotify).toHaveBeenCalledWith({
        tone: 'success',
        message: 'Sessão excluída com sucesso!',
      });
    });
  });

  it('displays contextual conflict message in toast and modal when session deletion returns 409 with detalhes', async () => {
    const user = userEvent.setup();
    vi.mocked(sessionService.remove).mockRejectedValue(
      new ApiError(409, ['Conflict'], {
        detalhes: { feedbacks: 3, avaliacoes: 5 },
      }),
    );

    renderComponent();

    const deleteBtn = await screen.findByRole('button', { name: 'Excluir Sessão 1' });
    await user.click(deleteBtn);

    await user.click(screen.getByRole('button', { name: 'Sim, excluir sessão' }));

    await waitFor(() => {
      expect(mockNotify).toHaveBeenCalledWith({
        tone: 'error',
        message:
          'Não é possível excluir: existem 3 feedbacks e 5 avaliações vinculados a esta sessão.',
      });
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Não é possível excluir: existem 3 feedbacks e 5 avaliações vinculados a esta sessão.',
      );
      expect(
        screen.getByRole('heading', { name: 'Não é possível excluir a sessão' }),
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Entendi' })).toBeInTheDocument();
    });
  });

  it('displays error notification when session deletion fails with 500', async () => {
    const user = userEvent.setup();
    vi.mocked(sessionService.remove).mockRejectedValue(
      new ApiError(500, ['Erro interno ao excluir sessão']),
    );

    renderComponent();

    const deleteBtn = await screen.findByRole('button', { name: 'Excluir Sessão 1' });
    await user.click(deleteBtn);

    await user.click(screen.getByRole('button', { name: 'Sim, excluir sessão' }));

    await waitFor(() => {
      expect(mockNotify).toHaveBeenCalledWith({
        tone: 'error',
        message: 'Erro interno ao excluir sessão',
      });
    });
  });

  it('navigates back to sessions list when clicking Concluir edição or Cancelar', async () => {
    const user = userEvent.setup();
    renderComponent();

    await user.click(screen.getByRole('button', { name: 'Concluir edição' }));
    expect(mockNavigate).toHaveBeenCalledWith('/turmas/room-1/problemas/prob-1');

    await user.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(mockNavigate).toHaveBeenCalledWith('/turmas/room-1/problemas/prob-1');
  });
});
