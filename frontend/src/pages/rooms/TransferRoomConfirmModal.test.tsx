import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TransferRoomConfirmModal } from './TransferRoomConfirmModal';

function renderConfirmModal({
  isOpen = true,
  targetTutorName = 'Profa. Santos',
  isLoading = false,
  errorMessage = null,
  onConfirm = vi.fn(),
  onClose = vi.fn(),
}: {
  isOpen?: boolean;
  targetTutorName?: string;
  isLoading?: boolean;
  errorMessage?: string | null;
  onConfirm?: () => void;
  onClose?: () => void;
} = {}) {
  const user = userEvent.setup();
  render(
    <TransferRoomConfirmModal
      isOpen={isOpen}
      targetTutorName={targetTutorName}
      isLoading={isLoading}
      errorMessage={errorMessage}
      onConfirm={onConfirm}
      onClose={onClose}
    />,
  );
  return { user, onConfirm, onClose };
}

describe('TransferRoomConfirmModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not render when isOpen is false', () => {
    renderConfirmModal({ isOpen: false });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders title, target tutor name, and warning message', () => {
    renderConfirmModal();

    expect(screen.getByRole('dialog', { name: 'Confirmar transferência' })).toBeInTheDocument();
    expect(screen.getByText('Profa. Santos')).toBeInTheDocument();
    expect(screen.getByText(/Você passará a atuar como/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Confirmar transferência' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument();
  });

  it('calls onConfirm when confirm button is clicked', async () => {
    const { user, onConfirm } = renderConfirmModal();

    await user.click(screen.getByRole('button', { name: 'Confirmar transferência' }));
    expect(onConfirm).toHaveBeenCalled();
  });

  it('calls onClose when cancel button is clicked', async () => {
    const { user, onClose } = renderConfirmModal();

    await user.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when close icon button is clicked', async () => {
    const { user, onClose } = renderConfirmModal();

    await user.click(screen.getByRole('button', { name: 'Fechar confirmação' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose on Escape key press when not loading', async () => {
    const { user, onClose } = renderConfirmModal();

    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalled();
  });

  it('displays error message when provided', () => {
    renderConfirmModal({ errorMessage: 'Erro na API ao transferir' });

    expect(screen.getByText('Erro na API ao transferir')).toBeInTheDocument();
  });

  it('disables cancel and close buttons while loading', () => {
    renderConfirmModal({ isLoading: true });

    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Fechar confirmação' })).toBeDisabled();
  });
});
