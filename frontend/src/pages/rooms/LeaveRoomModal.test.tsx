import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { LeaveRoomModal } from './LeaveRoomModal';

describe('LeaveRoomModal', () => {
  it('does not render anything when isOpen is false', () => {
    render(
      <LeaveRoomModal
        roomName="Turma Teste"
        isOpen={false}
        isLoading={false}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders title, room name and explicit access loss warning when open', () => {
    render(
      <LeaveRoomModal
        roomName="MI - Engenharia de Software · TP01"
        isOpen={true}
        isLoading={false}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Sair da turma?' })).toBeInTheDocument();
    expect(screen.getByText('MI - Engenharia de Software · TP01')).toBeInTheDocument();
    expect(screen.getByText(/ao sair da turma, você perderá o acesso às/i)).toBeInTheDocument();
    expect(screen.getByText(/atividades, problemas e materiais/i)).toBeInTheDocument();
  });

  it('calls onConfirm when clicking confirm button', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();

    render(
      <LeaveRoomModal
        roomName="Turma Teste"
        isOpen={true}
        isLoading={false}
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Sim, sair da turma' }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it('calls onCancel when clicking cancel button or close button', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();

    render(
      <LeaveRoomModal
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
