import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DeleteRoomModal } from './DeleteRoomModal';

describe('DeleteRoomModal', () => {
  it('does not render anything when isOpen is false', () => {
    render(
      <DeleteRoomModal
        roomName="Turma Teste"
        isOpen={false}
        isLoading={false}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders title, room name and explicit impact warning message when open', () => {
    render(
      <DeleteRoomModal
        roomName="MI - Engenharia de Software · TP01"
        isOpen={true}
        isLoading={false}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Excluir turma?' })).toBeInTheDocument();
    expect(screen.getByText('MI - Engenharia de Software · TP01')).toBeInTheDocument();
    expect(
      screen.getByText(/esta ação excluirá permanentemente a turma e todos os/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/dados de alunos, notas, problemas e avaliações/i)).toBeInTheDocument();
  });

  it('calls onConfirm when clicking confirm button', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();

    render(
      <DeleteRoomModal
        roomName="Turma Teste"
        isOpen={true}
        isLoading={false}
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Sim, excluir turma' }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it('calls onCancel when clicking safe cancel button or close button', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();

    render(
      <DeleteRoomModal
        roomName="Turma Teste"
        isOpen={true}
        isLoading={false}
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(onCancel).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: 'Fechar confirmação' }));
    expect(onCancel).toHaveBeenCalledTimes(2);
  });
});
