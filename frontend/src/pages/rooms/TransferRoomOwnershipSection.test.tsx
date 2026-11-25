import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { roomService } from '@/services/room.service';
import { ApiError } from '@/services/apiError';
import type { Room, RoomTutor } from '@/types/room';
import { TransferRoomOwnershipSection } from './TransferRoomOwnershipSection';

vi.mock('@/services/room.service', () => ({
  roomService: {
    listTutors: vi.fn(),
    transferOwnership: vi.fn(),
  },
}));

const mockNotify = vi.fn();
vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({ notify: mockNotify }),
}));

let mockUser = { id: 'tutor-1', nome: 'Prof. Carlos', tipo: 'PROFESSOR' };
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: mockUser }),
}));

const mockRoom: Room = {
  id: 'room-1',
  professorResponsavelId: 'tutor-1',
  nome: 'Engenharia de Software - TP01',
  codigoDisciplina: 'EXA123',
  codigoSala: 'aB7kP2x9',
  semestre: '2026.2',
  ativo: true,
  criadoEm: '2026-09-01T10:00:00.000Z',
};

const mockTutors: RoomTutor[] = [
  { id: 'tutor-1', nome: 'Prof. Carlos', email: 'carlos@uefs.br', responsavel: true },
  { id: 'tutor-2', nome: 'Profa. Maria', email: 'maria@uefs.br', responsavel: false },
  { id: 'tutor-3', nome: 'Prof. João', email: 'joao@uefs.br', responsavel: false },
];

describe('TransferRoomOwnershipSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUser = { id: 'tutor-1', nome: 'Prof. Carlos', tipo: 'PROFESSOR' };
  });

  it('does not render when logged in user is not the room owner', () => {
    mockUser = { id: 'tutor-2', nome: 'Profa. Maria', tipo: 'PROFESSOR' };
    vi.mocked(roomService.listTutors).mockResolvedValue(mockTutors);

    const { container } = render(
      <MemoryRouter>
        <TransferRoomOwnershipSection room={mockRoom} />
      </MemoryRouter>,
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders notice when no other professors are linked to the room', async () => {
    vi.mocked(roomService.listTutors).mockResolvedValue([mockTutors[0]]);

    render(
      <MemoryRouter>
        <TransferRoomOwnershipSection room={mockRoom} />
      </MemoryRouter>,
    );

    expect(
      await screen.findByText(/Nenhum outro professor está vinculado a esta turma no momento/i),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ver participantes e convidar' })).toHaveAttribute(
      'href',
      '/turmas/room-1/participantes',
    );
  });

  it('renders select field and transfer button with eligible tutors', async () => {
    vi.mocked(roomService.listTutors).mockResolvedValue(mockTutors);

    render(
      <MemoryRouter>
        <TransferRoomOwnershipSection room={mockRoom} />
      </MemoryRouter>,
    );

    expect(await screen.findByText('Transferir propriedade da turma')).toBeInTheDocument();
    expect(
      screen.getByRole('combobox', { name: 'Novo professor responsável' }),
    ).toBeInTheDocument();

    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(2);
    expect(screen.queryByRole('option', { name: 'Prof. Carlos' })).not.toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Profa. Maria' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Prof. João' })).toBeInTheDocument();
  });

  it('opens confirmation modal and executes transfer successfully', async () => {
    const user = userEvent.setup();
    const handleTransferred = vi.fn();
    vi.mocked(roomService.listTutors).mockResolvedValue(mockTutors);
    vi.mocked(roomService.transferOwnership).mockResolvedValue({
      id: 'room-1',
      professorResponsavelId: 'tutor-2',
    });

    render(
      <MemoryRouter>
        <TransferRoomOwnershipSection room={mockRoom} onTransferred={handleTransferred} />
      </MemoryRouter>,
    );

    const select = await screen.findByRole('combobox', { name: 'Novo professor responsável' });
    await user.selectOptions(select, 'tutor-2');

    const submitBtn = screen.getByRole('button', { name: 'Transferir propriedade' });
    expect(submitBtn).toBeEnabled();
    await user.click(submitBtn);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByText('Profa. Maria')).toBeInTheDocument();

    const confirmBtn = screen.getByRole('button', { name: 'Confirmar transferência' });
    await user.click(confirmBtn);

    expect(roomService.transferOwnership).toHaveBeenCalledWith('room-1', {
      professorId: 'tutor-2',
    });
    expect(mockNotify).toHaveBeenCalledWith({
      tone: 'success',
      message: 'Propriedade da turma transferida com sucesso!',
    });
    expect(handleTransferred).toHaveBeenCalledWith('tutor-2');
  });

  it('displays error in modal when transfer fails', async () => {
    const user = userEvent.setup();
    vi.mocked(roomService.listTutors).mockResolvedValue(mockTutors);
    vi.mocked(roomService.transferOwnership).mockRejectedValue(
      new ApiError(422, ['O professor destinatário está inativo.']),
    );

    render(
      <MemoryRouter>
        <TransferRoomOwnershipSection room={mockRoom} />
      </MemoryRouter>,
    );

    const select = await screen.findByRole('combobox', { name: 'Novo professor responsável' });
    await user.selectOptions(select, 'tutor-2');

    await user.click(screen.getByRole('button', { name: 'Transferir propriedade' }));
    await user.click(screen.getByRole('button', { name: 'Confirmar transferência' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'O professor destinatário está inativo.',
    );
    expect(mockNotify).toHaveBeenCalledWith({
      tone: 'error',
      message: 'O professor destinatário está inativo.',
    });
  });

  it('renders alert when loading tutors fails', async () => {
    vi.mocked(roomService.listTutors).mockRejectedValue(new Error('Network error'));

    render(
      <MemoryRouter>
        <TransferRoomOwnershipSection room={mockRoom} />
      </MemoryRouter>,
    );

    expect(
      await screen.findByText('Não foi possível carregar os professores da turma.'),
    ).toBeInTheDocument();
  });
});
