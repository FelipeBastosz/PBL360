import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ToastProvider } from '@/contexts/ToastProvider';
import { ApiError } from '@/services/apiError';
import { roomService } from '@/services/room.service';
import type { RoomTutor } from '@/types/room';
import { TransferRoomModal } from './TransferRoomModal';

vi.mock('@/services/room.service', () => ({
  roomService: {
    transferOwnership: vi.fn(),
  },
}));

const mockEligibleTutors: RoomTutor[] = [
  { id: 'tutor-2', nome: 'Profa. Santos', email: 'santos@uefs.br', responsavel: false },
  { id: 'tutor-3', nome: 'Prof. Oliveira', email: 'oliveira@uefs.br', responsavel: false },
];

function renderModal({
  isOpen = true,
  eligibleTutors = mockEligibleTutors,
  onClose = vi.fn(),
  onTransferred = vi.fn(),
  onInviteCoTutor = vi.fn(),
}: {
  isOpen?: boolean;
  eligibleTutors?: RoomTutor[];
  onClose?: () => void;
  onTransferred?: (newOwnerId: string) => void;
  onInviteCoTutor?: () => void;
} = {}) {
  const user = userEvent.setup();
  render(
    <ToastProvider>
      <TransferRoomModal
        isOpen={isOpen}
        onClose={onClose}
        roomId="room-123"
        eligibleTutors={eligibleTutors}
        onTransferred={onTransferred}
        onInviteCoTutor={onInviteCoTutor}
      />
    </ToastProvider>,
  );
  return { user, onClose, onTransferred, onInviteCoTutor };
}

describe('TransferRoomModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not render when isOpen is false', () => {
    renderModal({ isOpen: false });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders guidance and invite button when there are no eligible tutors', async () => {
    const { user, onInviteCoTutor } = renderModal({ eligibleTutors: [] });

    expect(
      screen.getByText(/Não há outros professores vinculados a esta turma no momento/),
    ).toBeInTheDocument();

    const inviteButton = screen.getByRole('button', { name: 'Adicionar co-tutor' });
    expect(inviteButton).toBeInTheDocument();

    await user.click(inviteButton);
    expect(onInviteCoTutor).toHaveBeenCalled();
  });

  it('renders selection with Transferir button disabled initially', () => {
    renderModal();

    expect(
      screen.getByRole('dialog', { name: 'Transferir propriedade da turma' }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Novo professor responsável')).toBeInTheDocument();

    const transferButton = screen.getByRole('button', { name: 'Transferir' });
    expect(transferButton).toBeDisabled();
  });

  it('opens confirmation modal after clicking Transferir and transfers successfully', async () => {
    vi.mocked(roomService.transferOwnership).mockResolvedValue({
      id: 'room-123',
      professorResponsavelId: 'tutor-2',
    });

    const { user, onClose, onTransferred } = renderModal();

    await user.selectOptions(screen.getByLabelText('Novo professor responsável'), 'tutor-2');

    const transferButton = screen.getByRole('button', { name: 'Transferir' });
    expect(transferButton).toBeEnabled();

    await user.click(transferButton);

    const confirmModal = screen.getByRole('dialog', { name: 'Confirmar transferência' });
    expect(confirmModal).toBeInTheDocument();
    expect(within(confirmModal).getByText('Profa. Santos')).toBeInTheDocument();

    await user.click(within(confirmModal).getByRole('button', { name: 'Confirmar transferência' }));

    expect(roomService.transferOwnership).toHaveBeenCalledWith('room-123', {
      professorId: 'tutor-2',
    });
    expect(onTransferred).toHaveBeenCalledWith('tutor-2');
    expect(onClose).toHaveBeenCalled();
  });

  it('shows error alert inside confirmation modal when transfer fails', async () => {
    vi.mocked(roomService.transferOwnership).mockRejectedValue(
      new ApiError(403, ['Apenas o professor responsável pode transferir a turma.']),
    );

    const { user, onClose, onTransferred } = renderModal();

    await user.selectOptions(screen.getByLabelText('Novo professor responsável'), 'tutor-2');
    await user.click(screen.getByRole('button', { name: 'Transferir' }));

    const confirmModal = screen.getByRole('dialog', { name: 'Confirmar transferência' });
    await user.click(within(confirmModal).getByRole('button', { name: 'Confirmar transferência' }));

    expect(
      await within(confirmModal).findByText(
        'Apenas o professor responsável pode transferir a turma.',
      ),
    ).toBeInTheDocument();
    expect(onTransferred).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('closes confirmation modal when Cancelar is clicked', async () => {
    const { user } = renderModal();

    await user.selectOptions(screen.getByLabelText('Novo professor responsável'), 'tutor-2');
    await user.click(screen.getByRole('button', { name: 'Transferir' }));

    const confirmModal = screen.getByRole('dialog', { name: 'Confirmar transferência' });
    expect(confirmModal).toBeInTheDocument();

    await user.click(within(confirmModal).getByRole('button', { name: 'Cancelar' }));
    expect(
      screen.queryByRole('dialog', { name: 'Confirmar transferência' }),
    ).not.toBeInTheDocument();
  });

  it('closes modal when cancel button is clicked', async () => {
    const { user, onClose } = renderModal();

    await user.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('closes modal on Escape key press', async () => {
    const { user, onClose } = renderModal();

    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalled();
  });
});
