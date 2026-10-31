import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import type * as Router from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { roomService } from '@/services/room.service';
import { userService } from '@/services/user.service';
import { ApiError } from '@/services/apiError';
import { clearUserPhotoCache } from '@/hooks/useUserPhoto';
import { ROUTES } from '@/routes/paths';
import type { Room } from '@/types/room';
import ManageRoomsPage from './ManageRoomsPage';

const mockNotify = vi.fn();
vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({ notify: mockNotify }),
}));

vi.mock('@/services/room.service', () => ({
  roomService: {
    list: vi.fn(),
    remove: vi.fn(),
  },
}));

vi.mock('@/services/user.service', () => ({
  userService: {
    getPhoto: vi.fn(),
  },
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'tutor-1', nome: 'Professor Fulano', possuiFoto: true },
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

const mockRooms: Room[] = [
  {
    id: 'room-1',
    nome: 'MI - Engenharia de Software · TP01',
    codigoDisciplina: 'EXA863',
    codigoSala: 'aB7kP2x9',
    semestre: '2026.2',
    ativo: true,
    criadoEm: '2026-01-01T00:00:00.000Z',
    professorResponsavelId: 'tutor-1',
  },
  {
    id: 'room-2',
    nome: 'MI - Algoritmos · TP02',
    codigoDisciplina: 'EXA801',
    codigoSala: 'xY9zW1a2',
    semestre: '2026.2',
    ativo: true,
    criadoEm: '2026-01-01T00:00:00.000Z',
    professorResponsavelId: 'tutor-2',
  },
];

describe('ManageRoomsPage', () => {
  beforeEach(() => {
    clearUserPhotoCache();
    vi.clearAllMocks();
    vi.mocked(roomService.list).mockResolvedValue(mockRooms);
    vi.mocked(userService.getPhoto).mockResolvedValue(new Blob(['png'], { type: 'image/png' }));
  });

  const renderComponent = () => {
    return render(
      <MemoryRouter>
        <ManageRoomsPage />
      </MemoryRouter>,
    );
  };

  it('shows the photo of the signed-in user in the header', async () => {
    renderComponent();

    expect(
      await screen.findByRole('img', { name: 'Foto de Professor Fulano' }),
    ).toBeInTheDocument();
    expect(userService.getPhoto).toHaveBeenCalledWith('tutor-1');
  });

  it('renders room list with action buttons and bottom footer', async () => {
    renderComponent();

    expect(await screen.findByText('MI - Engenharia de Software · TP01')).toBeInTheDocument();
    expect(screen.getByText('MI - Algoritmos · TP02')).toBeInTheDocument();

    expect(
      screen.getByRole('link', { name: 'Editar MI - Engenharia de Software · TP01' }),
    ).toHaveAttribute('href', '/turmas/room-1/editar');

    expect(screen.getByRole('button', { name: 'Concluir edição' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument();
  });

  it('opens delete confirmation modal when owner clicks trash icon', async () => {
    const user = userEvent.setup();
    renderComponent();

    expect(await screen.findByText('MI - Engenharia de Software · TP01')).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: 'Excluir MI - Engenharia de Software · TP01' }),
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Excluir turma?' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sim, excluir turma' })).toBeInTheDocument();
  });

  it('opens blocked warning modal when co-tutor clicks trash icon and does not call API', async () => {
    const user = userEvent.setup();
    renderComponent();

    expect(await screen.findByText('MI - Algoritmos · TP02')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Excluir MI - Algoritmos · TP02' }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Não é possível excluir a turma' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Você não possui permissão para excluir esta turma. Apenas o professor responsável pode realizar a exclusão.',
      ),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Sim, excluir turma' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Entendi' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(roomService.remove).not.toHaveBeenCalled();
  });

  it('deletes room via API and notifies with success toast on confirmation', async () => {
    const user = userEvent.setup();
    vi.mocked(roomService.remove).mockResolvedValue(undefined);

    renderComponent();

    expect(await screen.findByText('MI - Engenharia de Software · TP01')).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: 'Excluir MI - Engenharia de Software · TP01' }),
    );
    await user.click(screen.getByRole('button', { name: 'Sim, excluir turma' }));

    await waitFor(() => {
      expect(roomService.remove).toHaveBeenCalledWith('room-1');
      expect(screen.queryByText('MI - Engenharia de Software · TP01')).not.toBeInTheDocument();
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(mockNotify).toHaveBeenCalledWith({
        tone: 'success',
        message: 'Turma excluída com sucesso!',
      });
    });
  });

  it('displays error in modal and triggers error toast when API deletion fails', async () => {
    const user = userEvent.setup();
    vi.mocked(roomService.remove).mockRejectedValue(
      new ApiError(403, ['Apenas o professor responsável pode realizar esta ação.']),
    );

    renderComponent();

    expect(await screen.findByText('MI - Engenharia de Software · TP01')).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: 'Excluir MI - Engenharia de Software · TP01' }),
    );
    await user.click(screen.getByRole('button', { name: 'Sim, excluir turma' }));

    await waitFor(() => {
      expect(mockNotify).toHaveBeenCalledWith({
        tone: 'error',
        message: 'Apenas o professor responsável pode realizar esta ação.',
      });
      expect(
        screen.getByRole('heading', { name: 'Não é possível excluir a turma' }),
      ).toBeInTheDocument();
      expect(
        screen.getByText('Apenas o professor responsável pode realizar esta ação.'),
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Entendi' })).toBeInTheDocument();
    });
  });

  it('navigates back to rooms list when clicking Concluir edição or Cancelar', async () => {
    const user = userEvent.setup();
    renderComponent();

    await user.click(screen.getByRole('button', { name: 'Concluir edição' }));
    expect(mockNavigate).toHaveBeenCalledWith(ROUTES.rooms);

    await user.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(mockNavigate).toHaveBeenCalledWith(ROUTES.rooms);
  });
});
