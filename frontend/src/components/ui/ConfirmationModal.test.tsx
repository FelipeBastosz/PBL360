import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ConfirmationModal } from './ConfirmationModal';

describe('ConfirmationModal', () => {
  it('does not render when isOpen is false', () => {
    render(
      <ConfirmationModal
        isOpen={false}
        title="Confirmar Envio"
        description="Esta ação não pode ser desfeita"
        onConfirm={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders title, description and triggers onConfirm and onClose', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const onClose = vi.fn();

    render(
      <ConfirmationModal
        isOpen={true}
        title="Confirmar envio da avaliação?"
        description="Após o envio definitivo, não será possível alterar as notas."
        confirmLabel="Confirmar Envio"
        onConfirm={onConfirm}
        onClose={onClose}
      />,
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Confirmar envio da avaliação?')).toBeInTheDocument();
    expect(
      screen.getByText('Após o envio definitivo, não será possível alterar as notas.'),
    ).toBeInTheDocument();

    const confirmBtn = screen.getByRole('button', { name: 'Confirmar Envio' });
    await user.click(confirmBtn);
    expect(onConfirm).toHaveBeenCalledTimes(1);

    const cancelBtn = screen.getByRole('button', { name: 'Cancelar' });
    await user.click(cancelBtn);
    expect(onClose).toHaveBeenCalledTimes(1);

    const closeIconBtn = screen.getByRole('button', { name: 'Fechar confirmação' });
    await user.click(closeIconBtn);
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
