import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type * as Router from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { roomService } from '@/services/room.service';
import { problemService } from '@/services/problem.service';
import type { Room } from '@/types/room';
import type { Problem } from '@/types/problem';
import ManageProblemsPage from './ManageProblemsPage';

vi.mock('@/services/room.service', () => ({
  roomService: {
    getById: vi.fn(),
  },
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

const mockRoom: Room = {
  id: 'room-1',
  nome: 'MI - Algoritmos - TP02',
  codigoDisciplina: 'EXA801',
  codigoSala: 'aB7kP2x9',
  semestre: '2026.2',
  ativo: true,
  criadoEm: '2026-01-01',
  professorResponsavelId: '1',
};

const mockProblems: Problem[] = [
  {
    id: 'prob-1',
    salaId: 'room-1',
    titulo: 'Problema 1 - Introdução',
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
  },
];

describe('ManageProblemsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(roomService.getById).mockResolvedValue(mockRoom);
    vi.mocked(problemService.list).mockResolvedValue(mockProblems);
    vi.mocked(problemService.getDeletionImpact).mockResolvedValue({
      sessoes: 2,
      avaliacoes: 5,
      notas: 10,
      feedbacks: 0,
    });
  });

  const renderComponent = () => {
    return render(
      <MemoryRouter initialEntries={['/turmas/room-1/problemas/gerenciar']}>
        <Routes>
          <Route path="/turmas/:id/problemas/gerenciar" element={<ManageProblemsPage />} />
        </Routes>
      </MemoryRouter>,
    );
  };

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

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Editar Problema' })).toBeInTheDocument();
  });

  it('opens deletion modal with impact data and deletes problem on confirmation', async () => {
    const user = userEvent.setup();
    vi.mocked(problemService.remove).mockResolvedValue(undefined);

    renderComponent();

    const deleteBtn = await screen.findByRole('button', {
      name: 'Excluir Problema 1 - Introdução',
    });
    await user.click(deleteBtn);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Excluir problema?' })).toBeInTheDocument();
    expect(screen.getByText(/2 sessões/i)).toBeInTheDocument();

    // Confirma a exclusão
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

  it('navigates back to problems list when clicking Concluir edição or Cancelar', async () => {
    const user = userEvent.setup();
    renderComponent();

    await user.click(screen.getByRole('button', { name: 'Concluir edição' }));
    expect(mockNavigate).toHaveBeenCalledWith('/turmas/room-1/problemas');

    await user.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(mockNavigate).toHaveBeenCalledWith('/turmas/room-1/problemas');
  });
});
