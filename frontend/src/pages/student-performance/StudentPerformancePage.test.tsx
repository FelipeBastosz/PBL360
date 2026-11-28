import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthContext } from '@/contexts/authContext';
import { ApiError } from '@/services/apiError';
import { problemService } from '@/services/problem.service';
import { roomService } from '@/services/room.service';
import { studentPerformanceService } from '@/services/studentPerformance.service';
import type { UserResponse } from '@/types/auth';
import type { Problem } from '@/types/problem';
import type { RoomStudent } from '@/types/room';
import type { StudentPerformance, StudentPerformanceSession } from '@/types/studentPerformance';
import StudentPerformancePage from './StudentPerformancePage';

vi.mock('@/services/studentPerformance.service', () => ({
  studentPerformanceService: { get: vi.fn() },
}));
vi.mock('@/services/room.service', () => ({ roomService: { listStudents: vi.fn() } }));
vi.mock('@/services/problem.service', () => ({ problemService: { list: vi.fn() } }));
vi.mock('@/services/user.service', () => ({ userService: { getPhoto: vi.fn() } }));

const getPerformance = vi.mocked(studentPerformanceService.get);

const tutor = {
  id: 't1',
  nome: 'Paula Freitas',
  email: 'paula@uefs.br',
  tipo: 'PROFESSOR',
  possuiFoto: false,
} as UserResponse;

const students = [
  { id: 's1', nome: 'Ana Silva Santos' },
  { id: 's2', nome: 'João Pedro Lima' },
] as RoomStudent[];

const problems = [
  { id: 'p2', titulo: 'Problema 2', ordem: 2 },
  { id: 'p1', titulo: 'Problema 1', ordem: 1 },
] as Problem[];

function session(overrides: Partial<StudentPerformanceSession>): StudentPerformanceSession {
  return {
    sessaoId: 'x',
    problemaId: 'p1',
    problemaTitulo: 'Problema 1',
    rotulo: 'Sessão 1',
    data: '05-08-2026',
    nota: 7.5,
    situacao: 'AVALIADA',
    modalidade: 'TUTOR',
    presenca: 'PRESENTE',
    marcacoes: [],
    ...overrides,
  };
}

const sessions = [
  session({ sessaoId: 'a', rotulo: 'Abertura', nota: 7.5 }),
  session({
    sessaoId: 'b',
    rotulo: 'Fechamento',
    data: '12-08-2026',
    nota: null,
    situacao: 'PENDENTE',
  }),
  session({
    sessaoId: 'c',
    problemaId: 'p2',
    problemaTitulo: 'Problema 2',
    rotulo: 'Abertura',
    data: '19-08-2026',
    nota: 0,
    presenca: 'ATRASADO',
    marcacoes: [{ id: 'm1', nome: 'Não entregou', quantidade: 2 }],
  }),
];

const performance = (overrides: Partial<StudentPerformance> = {}): StudentPerformance => ({
  sala: { id: 'room-1', nome: 'Algoritmos - TP02' },
  aluno: { id: 's1', nome: 'Ana Silva Santos' },
  sessoes: sessions,
  ...overrides,
});

function renderPage(path = '/turmas/room-1/participantes/s1/evolucao') {
  return render(
    <AuthContext.Provider
      value={{ user: tutor, isAuthenticated: true, login: vi.fn(), logout: vi.fn() }}
    >
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route
            path="/turmas/:roomId/participantes/:studentId/evolucao"
            element={<StudentPerformancePage />}
          />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

const focusCard = () => screen.getByRole('region', { name: 'Sessão selecionada' });

describe('StudentPerformancePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(roomService.listStudents).mockResolvedValue(students);
    vi.mocked(problemService.list).mockResolvedValue(problems);
    getPerformance.mockResolvedValue(performance());
  });

  it('opens on the most recent session with the grade from the API, zero included', async () => {
    renderPage();

    expect(await screen.findByText('Sessão 3 de 3')).toBeInTheDocument();
    const card = focusCard();
    expect(within(card).getByText('0,0')).toBeInTheDocument();
    expect(within(card).getByText('Problema 2')).toBeInTheDocument();
    expect(within(card).getByText('Atrasado')).toBeInTheDocument();
    expect(within(card).getByText('×2')).toBeInTheDocument();
    expect(getPerformance).toHaveBeenCalledWith('room-1', 's1', null);
  });

  it('shows a pending grade as missing instead of zero', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(
      await screen.findByRole('button', { name: 'Problema 1, Fechamento, 12/08/2026: sem nota' }),
    );

    const card = focusCard();
    expect(within(card).getByText('Sem nota')).toBeInTheDocument();
    expect(within(card).queryByText('0,0')).not.toBeInTheDocument();
    expect(within(card).getByRole('img', { name: 'Sem nota registrada' })).toBeInTheDocument();
  });

  it('moves between sessions with the buttons and the keyboard', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Sessão 3 de 3');

    await user.click(screen.getByRole('button', { name: 'Sessão anterior' }));
    expect(screen.getByText('Sessão 2 de 3')).toBeInTheDocument();

    screen.getByRole('button', { name: /Fechamento, 12\/08\/2026/ }).focus();
    await user.keyboard('{ArrowLeft}');
    expect(screen.getByText('Sessão 1 de 3')).toBeInTheDocument();
    expect(within(focusCard()).getByText('7,5')).toBeInTheDocument();
  });

  it('asks the API for one problem and offers to go back to all of them when it is empty', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Sessão 3 de 3');
    getPerformance.mockResolvedValueOnce(performance({ sessoes: [] }));

    await user.click(screen.getByRole('button', { name: 'Problema 2' }));

    expect(getPerformance).toHaveBeenLastCalledWith('room-1', 's1', 'p2');
    expect(
      await screen.findByText('Ana ainda não tem sessões registradas em Problema 2.'),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Ver todos os problemas' }));
    expect(getPerformance).toHaveBeenLastCalledWith('room-1', 's1', null);
  });

  it('switches student without keeping the previous student on screen', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Sessão 3 de 3');
    getPerformance.mockReturnValueOnce(new Promise(() => {}));

    await user.selectOptions(screen.getByLabelText('Trocar aluno'), 's2');

    expect(getPerformance).toHaveBeenLastCalledWith('room-1', 's2', null);
    expect(screen.queryByText('Sessão 3 de 3')).not.toBeInTheDocument();
    expect(screen.getByRole('status', { name: 'Carregando desempenho' })).toBeInTheDocument();
  });

  it('explains when the tutor cannot see the student', async () => {
    getPerformance.mockRejectedValue(
      new ApiError(403, ['Apenas o professor responsável ou co-tutor da sala pode consultar.']),
    );
    renderPage();

    expect(await screen.findByText('Você não tem acesso a esta evolução')).toBeInTheDocument();
  });

  it('shows the error and loads again on retry', async () => {
    const user = userEvent.setup();
    getPerformance
      .mockRejectedValueOnce(new ApiError(500, ['Erro no servidor']))
      .mockResolvedValueOnce(performance());
    renderPage();

    expect(await screen.findByRole('alert')).toHaveTextContent('Erro no servidor');
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));

    expect(await screen.findByText('Sessão 3 de 3')).toBeInTheDocument();
  });

  it('keeps the chart readable with a single session', async () => {
    getPerformance.mockResolvedValue(performance({ sessoes: [sessions[0]] }));
    renderPage();

    expect(await screen.findByText('Sessão 1 de 1')).toBeInTheDocument();
    expect(screen.getByText('1 sessão')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Próxima sessão' })).toBeDisabled();
  });
});
