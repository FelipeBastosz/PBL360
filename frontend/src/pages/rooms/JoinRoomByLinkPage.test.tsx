import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthContext } from '@/contexts/authContext';
import { ToastProvider } from '@/contexts/ToastProvider';
import { ROUTES } from '@/routes/paths';
import { ApiError } from '@/services/apiError';
import { roomService } from '@/services/room.service';
import type { UserResponse } from '@/types/auth';
import JoinRoomByLinkPage from './JoinRoomByLinkPage';

vi.mock('@/services/room.service', () => ({
  roomService: { joinByCode: vi.fn() },
}));

const studentUser: UserResponse = {
  id: 'student-1',
  nome: 'Ana Souza',
  email: 'ana@discente.uefs.br',
  tipo: 'ALUNO',
  matricula: '20240001',
  possuiFoto: false,
  ativo: true,
  criadoEm: '2026-01-01',
};

const tutorUser: UserResponse = {
  ...studentUser,
  id: 'tutor-1',
  nome: 'Carlos Mendes',
  email: 'carlos@uefs.br',
  tipo: 'PROFESSOR',
  matricula: null,
};

function renderPage(initialPath: string, user: UserResponse = studentUser) {
  return render(
    <AuthContext.Provider value={{ user, isAuthenticated: true, login: vi.fn(), logout: vi.fn() }}>
      <ToastProvider>
        <MemoryRouter initialEntries={[initialPath]}>
          <Routes>
            <Route path={ROUTES.joinRoomByLink} element={<JoinRoomByLinkPage />} />
            <Route path={ROUTES.rooms} element={<h1>Minhas Turmas</h1>} />
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    </AuthContext.Provider>,
  );
}

describe('JoinRoomByLinkPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('joins the room using the URL code and redirects the student to rooms', async () => {
    vi.mocked(roomService.joinByCode).mockResolvedValue({
      mensagem: 'Você entrou na turma com sucesso.',
    });

    renderPage('/salas/aB7kP2x9');

    expect(await screen.findByRole('heading', { name: 'Minhas Turmas' })).toBeInTheDocument();
    expect(screen.getByText('Pronto! Você entrou na turma.')).toBeInTheDocument();
    expect(roomService.joinByCode).toHaveBeenCalledOnce();
    expect(roomService.joinByCode).toHaveBeenCalledWith({ codigoSala: 'aB7kP2x9' });
  });

  it('shows the API error message when joining fails', async () => {
    vi.mocked(roomService.joinByCode).mockRejectedValue(
      new ApiError(404, ['Turma não encontrada para o código informado.']),
    );

    renderPage('/salas/aB7kP2x9');

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Turma não encontrada para o código informado.',
    );
    expect(screen.getByRole('link', { name: 'Ir para minhas turmas' })).toHaveAttribute(
      'href',
      ROUTES.rooms,
    );
  });

  it('rejects malformed invite codes without calling the API', async () => {
    renderPage('/salas/curto');

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'O link de convite informado é inválido.',
    );
    expect(roomService.joinByCode).not.toHaveBeenCalled();
  });

  it('blocks tutors from joining via student invite link without calling the API', async () => {
    renderPage('/salas/aB7kP2x9', tutorUser);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Apenas alunos podem entrar em uma turma por link de convite.',
      );
    });
    expect(roomService.joinByCode).not.toHaveBeenCalled();
  });
});
