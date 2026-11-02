import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type * as Router from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { roomService } from '@/services/room.service';
import { problemService } from '@/services/problem.service';
import { ApiError } from '@/services/apiError';
import type { Room } from '@/types/room';
import type { Problem } from '@/types/problem';
import ManageProblemsPage from './ManageProblemsPage';

vi.mock('@/services/room.service', () => ({
  roomService: { getById: vi.fn() },
}));

vi.mock('@/services/problem.service', () => ({
  problemService: {
    list: vi.fn(),
    getDeletionImpact: vi.fn(),
    remove: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { nome: 'Professor Silva' } }),
}));

const mockNotify = vi.fn();
vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({ notify: mockNotify }),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof Router>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

const mockRoom: Room = {
  id: 'room-1',
  nome: 'Engenharia de Software',
  codigoDisciplina: 'ES101',
  codigoSala: 'SALA-01',
  semestre: '2026.1',
  ativo: true,
  professorResponsavelId: 'tutor-1',
  criadoEm: '2026-01-01',
};

const mockProblems: Problem[] = [
  {
    id: 'prob-1',
    salaId: 'room-1',
    titulo: 'Problema 1 - Introdução',
    descricao: 'Descrição do problema 1',
    ordem: 1,
    dataInicio: '2026-02-01',
    dataFim: '2026-02-10',
    criadoPor: 'tutor-1',
    criadoEm: '2026-01-01',
    atualizadoEm: '2026-01-01',
    tabelaId: null,
    autoavaliacaoLiberada: false,
    avaliacaoEntreParesLiberada: false,
    liberadoEm: null,
    prazoAutoavaliacao: null,
  },
  {
    id: 'prob-2',
    salaId: 'room-1',
    titulo: 'Problema 2 - Modelagem',
    descricao: 'Descrição do problema 2',
    ordem: 2,
    dataInicio: '2026-02-11',
    dataFim: '2026-02-20',
    criadoPor: 'tutor-1',
    criadoEm: '2026-01-01',
    atualizadoEm: '2026-01-01',
    tabelaId: null,
    autoavaliacaoLiberada: false,
    avaliacaoEntreParesLiberada: false,
    liberadoEm: null,
    prazoAutoavaliacao: null,
  },
];

describe('ManageProblemsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(roomService.getById).mockResolvedValue(mockRoom);
    vi.mocked(problemService.list).mockResolvedValue(mockProblems);
    vi.mocked(problemService.getDeletionImpact).mockResolvedValue({
      sessoes: 0,
      avaliacoes: 0,
      notas: 0,
      feedbacks: 0,
    });
  });

  const renderComponent = () =>
    render(
      <MemoryRouter initialEntries={['/turmas/room-1/problemas/gerenciar']}>
        <Routes>
          <Route path="/turmas/:id/problemas/gerenciar" element={<ManageProblemsPage />} />
        </Routes>
      </MemoryRouter>,
    );

  it('renders problem list with action buttons and footer', async () => {
    renderComponent();
    expect(await screen.findByText('Problema 1 - Introdução')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Editar Problema 1 - Introdução' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Excluir Problema 1 - Introdução' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Concluir edição' })).toBeInTheDocument();
  });

  it('opens edit modal when pencil icon is clicked', async () => {
    const user = userEvent.setup();
    renderComponent();

    const editBtn = await screen.findByRole('button', { name: 'Editar Problema 1 - Introdução' });
    await user.click(editBtn);

    expect(screen.getByRole('heading', { name: 'Editar Problema' })).toBeInTheDocument();
  });

  it('shows blocked modal with Entendi button when problem has linked sessions', async () => {
    const user = userEvent.setup();
    vi.mocked(problemService.getDeletionImpact).mockResolvedValue({
      sessoes: 2,
      avaliacoes: 5,
      notas: 10,
      feedbacks: 0,
    });

    renderComponent();
    const deleteBtn = await screen.findByRole('button', {
      name: 'Excluir Problema 1 - Introdução',
    });
    await user.click(deleteBtn);

    const dialog = screen.getByRole('dialog');
    expect(
      within(dialog).getByRole('heading', { name: 'Não é possível excluir o problema' }),
    ).toBeInTheDocument();
    expect(within(dialog).getByText(/2 sessões vinculadas/i)).toBeInTheDocument();
    expect(
      within(dialog).queryByRole('button', { name: 'Sim, excluir problema' }),
    ).not.toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: 'Entendi' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(problemService.remove).not.toHaveBeenCalled();
  });

  it('opens deletion modal and deletes problem on confirmation when has no sessions', async () => {
    const user = userEvent.setup();
    vi.mocked(problemService.remove).mockResolvedValue(undefined);

    renderComponent();
    const deleteBtn = await screen.findByRole('button', {
      name: 'Excluir Problema 1 - Introdução',
    });
    await user.click(deleteBtn);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Sim, excluir problema' }));

    await waitFor(() => {
      expect(problemService.remove).toHaveBeenCalledWith('room-1', 'prob-1');
      expect(screen.queryByText('Problema 1 - Introdução')).not.toBeInTheDocument();
      expect(mockNotify).toHaveBeenCalledWith({
        tone: 'success',
        message: 'Problema excluído com sucesso!',
      });
    });
  });

  it('cancels deletion and keeps problem in list when clicking Cancelar in modal', async () => {
    const user = userEvent.setup();
    renderComponent();
    const deleteBtn = await screen.findByRole('button', {
      name: 'Excluir Problema 1 - Introdução',
    });
    await user.click(deleteBtn);

    const dialog = screen.getByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Cancelar' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(problemService.remove).not.toHaveBeenCalled();
    expect(screen.getByText('Problema 1 - Introdução')).toBeInTheDocument();
  });

  it('shows error notification when problem deletion fails', async () => {
    const user = userEvent.setup();
    vi.mocked(problemService.remove).mockRejectedValue(
      new ApiError(500, ['Erro ao excluir o problema no servidor.']),
    );

    renderComponent();
    const deleteBtn = await screen.findByRole('button', {
      name: 'Excluir Problema 1 - Introdução',
    });
    await user.click(deleteBtn);
    await user.click(screen.getByRole('button', { name: 'Sim, excluir problema' }));

    await waitFor(() => {
      expect(mockNotify).toHaveBeenCalledWith({
        tone: 'error',
        message: 'Erro ao excluir o problema no servidor.',
      });
      expect(
        screen.getByRole('heading', { level: 3, name: 'Problema 1 - Introdução' }),
      ).toBeInTheDocument();
    });
  });

  it('displays contextual conflict message in toast and modal when problem deletion returns 409 with detalhes', async () => {
    const user = userEvent.setup();
    vi.mocked(problemService.remove).mockRejectedValue(
      new ApiError(409, ['Conflict'], {
        detalhes: { sessoes: 2, feedbacks: 1 },
      }),
    );

    renderComponent();
    const deleteBtn = await screen.findByRole('button', {
      name: 'Excluir Problema 1 - Introdução',
    });
    await user.click(deleteBtn);
    await user.click(screen.getByRole('button', { name: 'Sim, excluir problema' }));

    await waitFor(() => {
      expect(mockNotify).toHaveBeenCalledWith({
        tone: 'error',
        message:
          'Não é possível excluir: existem 2 sessões e 1 feedback vinculados a este problema.',
      });
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Não é possível excluir: existem 2 sessões e 1 feedback vinculados a este problema.',
      );
    });
  });

  it('navigates back to problems list when clicking Concluir edição or Cancelar', async () => {
    const user = userEvent.setup();
    renderComponent();

    await user.click(screen.getByRole('button', { name: 'Concluir edição' }));
    expect(mockNavigate).toHaveBeenCalledWith('/turmas/room-1/problemas');

    await user.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(mockNavigate).toHaveBeenCalledWith('/turmas/room-1/problemas');
  });
});
