import { screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/services/apiError';
import { roomService } from '@/services/room.service';
import { sessionStore } from '@/services/sessionStore';
import { renderApp, sessionFor, studentUser, tutorUser } from '@/testing/renderApp';

vi.mock('@/services/room.service');

const SUCCESS = { mensagem: 'Entrada na sala realizada com sucesso.' };

beforeEach(() => {
  vi.mocked(roomService.listMyRooms).mockResolvedValue([]);
  vi.mocked(roomService.list).mockResolvedValue([]);
});

afterEach(() => {
  vi.resetAllMocks();
  localStorage.clear();
});

function renderAsStudent() {
  sessionStore.save(sessionFor(studentUser));
  return renderApp('/turmas/entrar');
}

describe('JoinRoomPage', () => {
  it('renders the join room screen for students', async () => {
    renderAsStudent();

    expect(await screen.findByRole('heading', { name: 'Entrar na turma' })).toBeInTheDocument();
    expect(screen.getByLabelText('Código da Turma')).toBeInTheDocument();
    expect(
      screen.getByText('Digite o código fornecido pelo professor para entrar na turma'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ir para a turma' })).toBeInTheDocument();
  });

  it('asks for the code before calling the API', async () => {
    const { user } = renderAsStudent();

    await user.click(await screen.findByRole('button', { name: 'Ir para a turma' }));

    expect(screen.getByText('Informe o código da turma.')).toBeInTheDocument();
    expect(roomService.joinByCode).not.toHaveBeenCalled();
  });

  it('rejects a malformed code without calling the API', async () => {
    const { user } = renderAsStudent();

    await user.type(await screen.findByLabelText('Código da Turma'), 'EXA613-T1');
    await user.click(screen.getByRole('button', { name: 'Ir para a turma' }));

    expect(
      screen.getByText('O código deve ter 8 letras ou números (ex.: aB7kP2x9).'),
    ).toBeInTheDocument();
    expect(roomService.joinByCode).not.toHaveBeenCalled();
  });

  it('joins the room by code and returns to the room list', async () => {
    vi.mocked(roomService.joinByCode).mockResolvedValue(SUCCESS);
    const { user } = renderAsStudent();

    await user.type(await screen.findByLabelText('Código da Turma'), 'aB7kP2x9');
    await user.click(screen.getByRole('button', { name: 'Ir para a turma' }));

    expect(await screen.findByText('Pronto! Você entrou na turma.')).toBeInTheDocument();
    expect(roomService.joinByCode).toHaveBeenCalledWith({ codigoSala: 'aB7kP2x9' });
    expect(await screen.findByText(/minhas turmas/i)).toBeInTheDocument();
  });

  it('joins the room through a pasted invite link', async () => {
    vi.mocked(roomService.joinByLink).mockResolvedValue(SUCCESS);
    const { user } = renderAsStudent();

    await user.type(
      await screen.findByLabelText('Código da Turma'),
      'https://pbl360.com/salas/aB7kP2x9',
    );
    await user.click(screen.getByRole('button', { name: 'Ir para a turma' }));

    expect(await screen.findByText('Pronto! Você entrou na turma.')).toBeInTheDocument();
    expect(roomService.joinByLink).toHaveBeenCalledWith({
      link: 'https://pbl360.com/salas/aB7kP2x9',
    });
    expect(roomService.joinByCode).not.toHaveBeenCalled();
  });

  it('shows the API message when the room is unavailable', async () => {
    vi.mocked(roomService.joinByCode).mockRejectedValue(
      new ApiError(404, ['Código de ingresso inválido ou sala indisponível.']),
    );
    const { user } = renderAsStudent();

    await user.type(await screen.findByLabelText('Código da Turma'), 'zzzzzzzz');
    await user.click(screen.getByRole('button', { name: 'Ir para a turma' }));

    expect(
      await screen.findByText('Código de ingresso inválido ou sala indisponível.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Entrar na turma' })).toBeInTheDocument();
  });

  it('sends tutors back to their room list', async () => {
    sessionStore.save(sessionFor(tutorUser));
    renderApp('/turmas/entrar');

    expect(await screen.findByText(/minhas turmas/i)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Entrar na turma' })).not.toBeInTheDocument();
  });
});
