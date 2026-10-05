import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ToastProvider } from '@/contexts/ToastProvider';
import { roomService } from '@/services/room.service';
import { userService } from '@/services/user.service';
import type { RoomTutor } from '@/types/room';
import { RoomInviteSheet } from './RoomInviteSheet';

vi.mock('@/services/room.service', () => ({
  roomService: { listTutors: vi.fn(), addTutor: vi.fn(), removeTutor: vi.fn() },
}));

vi.mock('@/services/user.service', () => ({
  userService: { searchTutors: vi.fn(), getPhoto: vi.fn() },
}));

const owner: RoomTutor = { id: 't1', nome: 'Ana Lima', email: 'ana@uefs.br', responsavel: true };
const coTutor: RoomTutor = {
  id: 't2',
  nome: 'Bruno Reis',
  email: 'bruno@uefs.br',
  responsavel: false,
};
const candidate = { id: 't3', nome: 'Carla Dias', email: 'carla@uefs.br' };

function renderSheet(isOwner = true) {
  const user = userEvent.setup();
  render(
    <ToastProvider>
      <RoomInviteSheet
        isOpen
        onClose={vi.fn()}
        roomId="room-1"
        roomName="MI Programação - TP01"
        roomCode="aB7kP2x9"
        isOwner={isOwner}
      />
    </ToastProvider>,
  );
  return user;
}

async function openTutorsTab(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('tab', { name: 'Professores' }));
  await screen.findByText('Ana Lima');
}

describe('RoomInviteSheet', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(roomService.listTutors).mockResolvedValue([owner, coTutor]);
    vi.mocked(userService.getPhoto).mockRejectedValue(new Error('sem foto'));
    vi.mocked(userService.searchTutors).mockResolvedValue([candidate, coTutor]);
    vi.mocked(roomService.addTutor).mockResolvedValue({ mensagem: 'ok' });
    vi.mocked(roomService.removeTutor).mockResolvedValue({ mensagem: 'ok' });
  });

  it('opens on the student tab with the room code and invite link', () => {
    renderSheet();

    expect(screen.getByRole('dialog', { name: 'Convidar para a turma' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Alunos' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getAllByText('aB7kP2x9').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'Compartilhar convite' })).toBeInTheDocument();
  });

  it('asks for at least three letters before searching tutors', async () => {
    const user = renderSheet();
    await openTutorsTab(user);

    await user.type(screen.getByLabelText('Buscar professor por nome ou e-mail'), 'ca');

    expect(await screen.findByText('Digite ao menos 3 letras.')).toBeInTheDocument();
    expect(userService.searchTutors).not.toHaveBeenCalled();
  });

  it('adds a tutor found by the owner, leaving out who is already in the room', async () => {
    const user = renderSheet();
    await openTutorsTab(user);
    const search = screen.getByLabelText('Buscar professor por nome ou e-mail');

    await user.type(search, 'car');
    await user.click(await screen.findByRole('button', { name: 'Adicionar Carla Dias' }));

    expect(screen.queryByRole('button', { name: 'Adicionar Bruno Reis' })).not.toBeInTheDocument();
    expect(roomService.addTutor).toHaveBeenCalledWith('room-1', { professorId: 't3' });
    expect(
      await screen.findByText('Carla Dias agora também é professor desta turma.'),
    ).toBeInTheDocument();
    await waitFor(() => expect(search).toHaveValue(''));
  });

  it('removes a co-tutor only after confirmation and never offers to remove the owner', async () => {
    const user = renderSheet();
    await openTutorsTab(user);

    expect(screen.queryByRole('button', { name: 'Remover Ana Lima' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Remover Bruno Reis' }));
    expect(roomService.removeTutor).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Remover' }));

    expect(roomService.removeTutor).toHaveBeenCalledWith('room-1', 't2');
    expect(await screen.findByText('Bruno Reis foi removido da turma.')).toBeInTheDocument();
  });

  it('shows the tutors read-only to someone who is not the owner', async () => {
    const user = renderSheet(false);
    await openTutorsTab(user);

    expect(
      screen.getByText(
        'Só o professor responsável pela turma pode convidar ou remover professores.',
      ),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText('Buscar professor por nome ou e-mail')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Remover / })).not.toBeInTheDocument();
  });
});
