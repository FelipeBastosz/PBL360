import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthContext } from '@/contexts/authContext';
import { ApiError } from '@/services/apiError';
import { feedbackService } from '@/services/feedback.service';
import { problemService } from '@/services/problem.service';
import { roomService } from '@/services/room.service';
import type { UserResponse } from '@/types/auth';
import type { ReceivedProblemFeedbacksResponse } from '@/types/feedback';
import type { Problem } from '@/types/problem';
import type { StudentRoom } from '@/types/room';
import MyPerformancePage from './MyPerformancePage';

vi.mock('@/services/room.service', () => ({ roomService: { listMyRooms: vi.fn() } }));
vi.mock('@/services/problem.service', () => ({ problemService: { list: vi.fn() } }));
vi.mock('@/services/feedback.service', () => ({
  feedbackService: { getMyProblemFeedbacks: vi.fn() },
}));
vi.mock('@/services/user.service', () => ({ userService: { getPhoto: vi.fn() } }));

const getFeedbacks = vi.mocked(feedbackService.getMyProblemFeedbacks);

const student = {
  id: 'aluno-1',
  nome: 'Ana Souza',
  email: '20240001@discente.uefs.br',
  tipo: 'ALUNO',
  possuiFoto: false,
} as UserResponse;

const problems = [
  { id: 'p2', titulo: 'Problema 2', ordem: 2 },
  { id: 'p1', titulo: 'Problema 1', ordem: 1 },
] as Problem[];

const tutorFeedback = (nota: number | null) => ({
  id: 'f1',
  autor: { id: 't1', nome: 'Prof. Carlos' },
  texto: 'Boa condução do grupo.',
  criadoEm: '2026-02-03T10:00:00.000Z',
  editadoEm: null,
  novo: false,
  nota,
});

const FEEDBACKS: Record<string, ReceivedProblemFeedbacksResponse> = {
  p1: {
    notaFinal: 7.5,
    individual: null,
    geral: null,
    sessoes: [
      { sessaoId: 's1', rotulo: 'Abertura', data: '03-02-2026', feedback: tutorFeedback(7.5) },
      { sessaoId: 's2', rotulo: 'Fechamento', data: '10-02-2026', feedback: null },
    ],
  },
  p2: {
    notaFinal: 0,
    individual: null,
    geral: null,
    sessoes: [
      {
        sessaoId: 's3',
        rotulo: 'Abertura',
        data: '17-02-2026',
        feedback: null,
        nota: 0,
        avaliacoes: { modalidade: 'AUTOAVALIACAO', autoavaliacao: null, pares: null },
      },
    ],
  },
};

function renderPage(path = '/turmas/room-1/minha-evolucao') {
  return render(
    <AuthContext.Provider
      value={{ user: student, isAuthenticated: true, login: vi.fn(), logout: vi.fn() }}
    >
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/turmas/:roomId/minha-evolucao" element={<MyPerformancePage />} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

const focusCard = () => screen.getByRole('region', { name: 'Sessão selecionada' });

describe('MyPerformancePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(roomService.listMyRooms).mockResolvedValue([
      { salaId: 'room-1', nome: 'Algoritmos - TP02', semestre: '2026.1', totalAlunos: 2 },
    ] as StudentRoom[]);
    vi.mocked(problemService.list).mockResolvedValue(problems);
    getFeedbacks.mockImplementation(async (_roomId, problemId) => FEEDBACKS[problemId]);
  });

  it('joins every problem in date order and opens on the latest session, zero included', async () => {
    renderPage();

    expect(await screen.findByText('Sessão 3 de 3')).toBeInTheDocument();
    expect(getFeedbacks).toHaveBeenCalledWith('room-1', 'p1');
    expect(getFeedbacks).toHaveBeenCalledWith('room-1', 'p2');
    const card = focusCard();
    expect(within(card).getByText('0,0')).toBeInTheDocument();
    expect(within(card).getByText('Problema 2')).toBeInTheDocument();
    expect(within(card).getByText('Autoavaliação')).toBeInTheDocument();
  });

  it('shows the tutor grade and feedback once they are released', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(
      await screen.findByRole('button', { name: 'Problema 1, Abertura, 03/02/2026: nota 7,5' }),
    );

    const card = focusCard();
    expect(within(card).getByText('7,5')).toBeInTheDocument();
    expect(within(card).getByText('Boa condução do grupo.')).toBeInTheDocument();
    expect(within(card).getByText('Tutor')).toBeInTheDocument();
  });

  it('treats an unreleased grade as awaiting release and never shows marks', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(
      await screen.findByRole('button', { name: 'Problema 1, Fechamento, 10/02/2026: sem nota' }),
    );

    const card = focusCard();
    expect(within(card).getByText('Sem nota')).toBeInTheDocument();
    expect(within(card).getByText('Aguardando liberação')).toBeInTheDocument();
    expect(within(card).getByText('Ainda não enviado')).toBeInTheDocument();
    expect(screen.queryByText('Marcações')).not.toBeInTheDocument();
  });

  it('filters by problem and offers to go back to all of them when it is empty', async () => {
    const user = userEvent.setup();
    getFeedbacks.mockImplementation(async (_roomId, problemId) =>
      problemId === 'p2' ? { ...FEEDBACKS.p2, sessoes: [] } : FEEDBACKS[problemId],
    );
    renderPage();
    await screen.findByText('Sessão 2 de 2');

    await user.click(screen.getByRole('button', { name: 'Problema 2' }));

    expect(
      screen.getByText('Você ainda não tem sessões registradas em Problema 2.'),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Ver todos os problemas' }));
    expect(screen.getByText('Sessão 2 de 2')).toBeInTheDocument();
  });

  it('explains when the student is not part of the room', async () => {
    vi.mocked(roomService.listMyRooms).mockResolvedValue([]);
    renderPage();

    expect(await screen.findByText('Você não tem acesso a esta evolução')).toBeInTheDocument();
    expect(screen.getByText('Você não faz parte desta turma.')).toBeInTheDocument();
  });

  it('shows the error and loads again on retry', async () => {
    const user = userEvent.setup();
    getFeedbacks.mockRejectedValueOnce(new ApiError(500, ['Erro no servidor']));
    renderPage();

    expect(await screen.findByRole('alert')).toHaveTextContent('Erro no servidor');
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));

    expect(await screen.findByText('Sessão 3 de 3')).toBeInTheDocument();
  });
});
