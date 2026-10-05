import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ToastProvider } from '@/contexts/ToastProvider';
import { ApiError } from '@/services/apiError';
import { roomService } from '@/services/room.service';
import { JoinRoomSheet } from './JoinRoomSheet';

vi.mock('@/services/room.service', () => ({
  roomService: { joinByCode: vi.fn(), joinByLink: vi.fn() },
}));

const SUCCESS = { mensagem: 'Entrada na sala realizada com sucesso.' };

function renderSheet() {
  const user = userEvent.setup();
  const onClose = vi.fn();
  const onJoined = vi.fn();
  render(
    <ToastProvider>
      <JoinRoomSheet isOpen onClose={onClose} onJoined={onJoined} />
    </ToastProvider>,
  );
  return { user, onClose, onJoined };
}

async function submitCode(user: ReturnType<typeof userEvent.setup>, value: string) {
  await user.type(screen.getByLabelText('Código da Turma'), value);
  await user.click(screen.getByRole('button', { name: 'Ir para a turma' }));
}

describe('JoinRoomSheet', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the join form inside a dialog', () => {
    renderSheet();

    expect(screen.getByRole('dialog', { name: 'Entrar na turma' })).toBeInTheDocument();
    expect(screen.getByLabelText('Código da Turma')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ir para a turma' })).toBeInTheDocument();
  });

  it('asks for the code before calling the API', async () => {
    const { user, onJoined } = renderSheet();

    await user.click(screen.getByRole('button', { name: 'Ir para a turma' }));

    expect(screen.getByText('Informe o código da turma.')).toBeInTheDocument();
    expect(roomService.joinByCode).not.toHaveBeenCalled();
    expect(onJoined).not.toHaveBeenCalled();
  });

  it('rejects a malformed code without calling the API', async () => {
    const { user } = renderSheet();

    await submitCode(user, 'EXA613-T1');

    expect(
      screen.getByText('O código deve ter 8 letras ou números (ex.: aB7kP2x9).'),
    ).toBeInTheDocument();
    expect(roomService.joinByCode).not.toHaveBeenCalled();
  });

  it('joins the room by code and reports success', async () => {
    vi.mocked(roomService.joinByCode).mockResolvedValue(SUCCESS);
    const { user, onJoined } = renderSheet();

    await submitCode(user, 'aB7kP2x9');

    expect(await screen.findByText('Pronto! Você entrou na turma.')).toBeInTheDocument();
    expect(roomService.joinByCode).toHaveBeenCalledWith({ codigoSala: 'aB7kP2x9' });
    expect(onJoined).toHaveBeenCalledOnce();
  });

  it('joins the room through a pasted invite link', async () => {
    vi.mocked(roomService.joinByLink).mockResolvedValue(SUCCESS);
    const { user, onJoined } = renderSheet();

    await submitCode(user, 'https://pbl360.com/salas/aB7kP2x9');

    expect(await screen.findByText('Pronto! Você entrou na turma.')).toBeInTheDocument();
    expect(roomService.joinByLink).toHaveBeenCalledWith({
      link: 'https://pbl360.com/salas/aB7kP2x9',
    });
    expect(roomService.joinByCode).not.toHaveBeenCalled();
    expect(onJoined).toHaveBeenCalledOnce();
  });

  it('keeps the sheet open with the API message when the room is unavailable', async () => {
    vi.mocked(roomService.joinByCode).mockRejectedValue(
      new ApiError(404, ['Código de ingresso inválido ou sala indisponível.']),
    );
    const { user, onJoined } = renderSheet();

    await submitCode(user, 'zzzzzzzz');

    expect(
      await screen.findByText('Código de ingresso inválido ou sala indisponível.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: 'Entrar na turma' })).toBeInTheDocument();
    expect(onJoined).not.toHaveBeenCalled();
  });

  it('closes when the user dismisses it', async () => {
    const { user, onClose } = renderSheet();

    await user.click(screen.getByRole('button', { name: 'Fechar' }));

    expect(onClose).toHaveBeenCalledOnce();
  });
});
