import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { TransferRoomOwnershipModal } from './TransferRoomOwnershipModal';

describe('TransferRoomOwnershipModal', () => {
  it('renders title, target tutor name, and role transition warning when open', () => {
    render(
      <TransferRoomOwnershipModal
        isOpen={true}
        targetTutorName="Prof. João Silva"
        isLoading={false}
        onConfirm={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Transferir propriedade?')).toBeInTheDocument();
    expect(screen.getByText('Prof. João Silva')).toBeInTheDocument();
    expect(
      screen.getByText(/Você deixará de ser o responsável principal desta turma/i),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Confirmar transferência' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    render(
      <TransferRoomOwnershipModal
        isOpen={false}
        targetTutorName="Prof. João Silva"
        isLoading={false}
        onConfirm={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders error message when present', () => {
    render(
      <TransferRoomOwnershipModal
        isOpen={true}
        targetTutorName="Prof. João Silva"
        isLoading={false}
        errorMessage="O professor destinatário está inativo."
        onConfirm={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('O professor destinatário está inativo.');
  });

  it('calls onConfirm when confirm button is clicked', async () => {
    const user = userEvent.setup();
    const handleConfirm = vi.fn();

    render(
      <TransferRoomOwnershipModal
        isOpen={true}
        targetTutorName="Prof. João Silva"
        isLoading={false}
        onConfirm={handleConfirm}
        onClose={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Confirmar transferência' }));
    expect(handleConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when cancel or close button is clicked', async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();

    render(
      <TransferRoomOwnershipModal
        isOpen={true}
        targetTutorName="Prof. João Silva"
        isLoading={false}
        onConfirm={vi.fn()}
        onClose={handleClose}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(handleClose).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: 'Fechar confirmação' }));
    expect(handleClose).toHaveBeenCalledTimes(2);
  });

  it('disables actions when isLoading is true', () => {
    render(
      <TransferRoomOwnershipModal
        isOpen={true}
        targetTutorName="Prof. João Silva"
        isLoading={true}
        onConfirm={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Fechar confirmação' })).toBeDisabled();
  });
});
