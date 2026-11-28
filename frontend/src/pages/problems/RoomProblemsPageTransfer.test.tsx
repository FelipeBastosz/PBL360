import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthContext } from '@/contexts/authContext';
import { conversationService } from '@/services/conversation.service';
import { roomService } from '@/services/room.service';
import { problemService } from '@/services/problem.service';
import type { UserResponse } from '@/types/auth';
import type { Room } from '@/types/room';
import RoomProblemsPage from './RoomProblemsPage';

vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({
    notify: vi.fn(),
  }),
}));

vi.mock('@/services/room.service', () => ({
  roomService: {
    getById: vi.fn(),
    listMyRooms: vi.fn(),
    listTutors: vi.fn(),
    transferOwnership: vi.fn(),
  },
}));

vi.mock('@/services/conversation.service', () => ({
  conversationService: {
    listForRoom: vi.fn(),
  },
}));

vi.mock('@/services/problem.service', () => ({
  problemService: {
    list: vi.fn(),
  },
}));

const mockOwner: UserResponse = {
  id: 'user-owner',
  nome: 'Professor Responsavel',
  email: 'owner@test.com',
  tipo: 'PROFESSOR',
  matricula: null,
  possuiFoto: false,
  ativo: true,
  criadoEm: '2026-01-01',
};

const mockCoTutor: UserResponse = {
  id: 'user-cotutor',
  nome: 'Professora Co-tutora',
  email: 'cotutor@test.com',
  tipo: 'PROFESSOR',
  matricula: null,
  possuiFoto: false,
  ativo: true,
  criadoEm: '2026-01-01',
};

const mockRoom: Room = {
  id: 'room-1',
  nome: 'MI - Algoritmos - TP02',
  codigoDisciplina: 'EXA801',
  codigoSala: 'aB7kP2x9',
  semestre: '2026.2',
  ativo: true,
  criadoEm: '2026-01-01T00:00:00.000Z',
  professorResponsavelId: 'user-owner',
};

function renderComponent(user: UserResponse) {
  return render(
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: true,
        login: vi.fn(),
        logout: vi.fn(),
      }}
    >
      <MemoryRouter initialEntries={['/turmas/room-1/problemas']}>
        <Routes>
          <Route path="/turmas/:id/problemas" element={<RoomProblemsPage />} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

describe('RoomProblemsPage - Transfer Room Ownership', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(roomService.getById).mockResolvedValue(mockRoom);
    vi.mocked(problemService.list).mockResolvedValue([]);
    vi.mocked(conversationService.listForRoom).mockResolvedValue([]);
    vi.mocked(roomService.listMyRooms).mockResolvedValue([
      { salaId: 'room-1', nome: 'MI - Algoritmos - TP02', semestre: '2026.2', totalAlunos: 3 },
    ]);
  });

  it('shows "Transferir turma" in fab menu when user is the room owner', async () => {
    renderComponent(mockOwner);
    const fab = await screen.findByRole('button', { name: /ações de problema/i });
    await userEvent.click(fab);

    expect(screen.getByRole('button', { name: 'Transferir turma' })).toBeInTheDocument();
  });

  it('does not show "Transferir turma" in fab menu when user is a co-tutor', async () => {
    renderComponent(mockCoTutor);
    const fab = await screen.findByRole('button', { name: /ações de problema/i });
    await userEvent.click(fab);

    expect(screen.queryByRole('button', { name: 'Transferir turma' })).not.toBeInTheDocument();
  });

  it('explains tutor requirement and offers invite button when there are no co-tutors', async () => {
    vi.mocked(roomService.listTutors).mockResolvedValue([
      {
        id: 'user-owner',
        nome: 'Professor Responsavel',
        email: 'owner@test.com',
        responsavel: true,
      },
    ]);
    renderComponent(mockOwner);

    const fab = await screen.findByRole('button', { name: /ações de problema/i });
    await userEvent.click(fab);
    await userEvent.click(screen.getByRole('button', { name: 'Transferir turma' }));

    expect(
      await screen.findByRole('dialog', { name: 'Transferir propriedade da turma' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Não há outros professores vinculados a esta turma no momento/),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Adicionar co-tutor' }));

    expect(
      await screen.findByRole('dialog', { name: 'Convidar para a turma' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Professores' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });

  it('opens transfer modal when clicking transfer and co-tutors exist', async () => {
    vi.mocked(roomService.listTutors).mockResolvedValue([
      {
        id: 'user-owner',
        nome: 'Professor Responsavel',
        email: 'owner@test.com',
        responsavel: true,
      },
      {
        id: 'user-cotutor',
        nome: 'Professora Co-tutora',
        email: 'cotutor@test.com',
        responsavel: false,
      },
    ]);
    renderComponent(mockOwner);

    const fab = await screen.findByRole('button', { name: /ações de problema/i });
    await userEvent.click(fab);
    await userEvent.click(screen.getByRole('button', { name: 'Transferir turma' }));

    expect(
      await screen.findByRole('dialog', { name: 'Transferir propriedade da turma' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Transferir' })).toBeDisabled();
  });

  it('transfers ownership, closes modals and updates fab actions so transfer is removed', async () => {
    vi.mocked(roomService.listTutors).mockResolvedValue([
      {
        id: 'user-owner',
        nome: 'Professor Responsavel',
        email: 'owner@test.com',
        responsavel: true,
      },
      {
        id: 'user-cotutor',
        nome: 'Professora Co-tutora',
        email: 'cotutor@test.com',
        responsavel: false,
      },
    ]);
    vi.mocked(roomService.transferOwnership).mockResolvedValue({
      id: 'room-1',
      professorResponsavelId: 'user-cotutor',
    });

    renderComponent(mockOwner);

    const fab = await screen.findByRole('button', { name: /ações de problema/i });
    await userEvent.click(fab);
    await userEvent.click(screen.getByRole('button', { name: 'Transferir turma' }));

    expect(
      await screen.findByRole('dialog', { name: 'Transferir propriedade da turma' }),
    ).toBeInTheDocument();

    await userEvent.selectOptions(
      screen.getByLabelText('Novo professor responsável'),
      'user-cotutor',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Transferir' }));

    expect(
      await screen.findByRole('dialog', { name: 'Confirmar transferência' }),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar transferência' }));

    await waitFor(() => {
      expect(
        screen.queryByRole('dialog', { name: 'Confirmar transferência' }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole('dialog', { name: 'Transferir propriedade da turma' }),
      ).not.toBeInTheDocument();
    });

    const fabAfter = screen.getByRole('button', { name: /ações de problema/i });
    await userEvent.click(fabAfter);
    expect(screen.queryByRole('button', { name: 'Transferir turma' })).not.toBeInTheDocument();
  });
});
