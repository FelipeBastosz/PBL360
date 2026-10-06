import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import type * as Router from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { roomService } from '@/services/room.service';
import { userService } from '@/services/user.service';
import { ROUTES } from '@/routes/paths';
import type { Room } from '@/types/room';
import ManageRoomsPage from './ManageRoomsPage';

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
    professorResponsavelId: '1',
  },
  {
    id: 'room-2',
    nome: 'MI - Algoritmos · TP02',
    codigoDisciplina: 'EXA801',
    codigoSala: 'xY9zW1a2',
    semestre: '2026.2',
    ativo: true,
    criadoEm: '2026-01-01T00:00:00.000Z',
    professorResponsavelId: '1',
  },
];

describe('ManageRoomsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(roomService.list).mockResolvedValue(mockRooms);
    vi.mocked(userService.getPhoto).mockResolvedValue(new Blob(['png'], { type: 'image/png' }));
  });

  it('shows the photo of the signed-in user in the header', async () => {
    render(
      <MemoryRouter>
        <ManageRoomsPage />
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole('img', { name: 'Foto de Professor Fulano' }),
    ).toBeInTheDocument();
    expect(userService.getPhoto).toHaveBeenCalledWith('tutor-1');
  });

  const renderComponent = () => {
    return render(
      <MemoryRouter>
        <ManageRoomsPage />
      </MemoryRouter>,
    );
  };

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

  it('opens delete confirmation modal when trash icon is clicked', async () => {
    const user = userEvent.setup();
    renderComponent();

    expect(await screen.findByText('MI - Engenharia de Software · TP01')).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: 'Excluir MI - Engenharia de Software · TP01' }),
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Excluir turma?' })).toBeInTheDocument();
  });

  it('deletes room via API and removes card from list on confirmation', async () => {
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
