import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthContext } from '@/contexts/authContext';
import { problemService } from '@/services/problem.service';
import { roomService } from '@/services/room.service';
import type { UserResponse } from '@/types/auth';
import type { Problem } from '@/types/problem';
import type { Room } from '@/types/room';
import SessionReportPage from './SessionReportPage';

vi.mock('@/services/problem.service', () => ({
  problemService: {
    getById: vi.fn(),
  },
}));

vi.mock('@/services/room.service', () => ({
  roomService: {
    getById: vi.fn(),
  },
}));

const mockTeacher: UserResponse = {
  id: '1',
  nome: 'Professor Fulano',
  email: 'prof@test.com',
  tipo: 'PROFESSOR',
  matricula: null,
  possuiFoto: false,
  ativo: true,
  criadoEm: '2026-01-01',
};

const mockProblem: Problem = {
  id: 'prob-1',
  salaId: 'room-1',
  titulo: 'Problema 1 - Prontuário Eletrônico',
  descricao: null,
  ordem: 1,
  dataInicio: null,
  dataFim: null,
  tabelaId: null,
  autoavaliacaoLiberada: false,
  avaliacaoEntreParesLiberada: false,
  liberadoEm: null,
  prazoAutoavaliacao: null,
  criadoPor: 'tutor-1',
  criadoEm: '2026-01-01',
  atualizadoEm: '2026-01-01',
};

const mockRoom: Room = {
  id: 'room-1',
  nome: 'Engenharia de Software - Turma A',
  semestre: '2026.2',
  codigoDisciplina: 'EXA123',
  codigoSala: 'SAL1',
  professorResponsavelId: '1',
  ativo: true,
  criadoEm: '2026-01-01',
};

function renderPage(initialEntry = '/turmas/room-1/problemas/prob-1/sessoes/sess-1/relatorio') {
  return render(
    <AuthContext.Provider
      value={{
        user: mockTeacher,
        isAuthenticated: true,
        login: vi.fn(),
        logout: vi.fn(),
      }}
    >
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route
            path="/turmas/:roomId/problemas/:problemId/sessoes/:sessionId/relatorio"
            element={<SessionReportPage />}
          />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

describe('SessionReportPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(problemService.getById).mockResolvedValue(mockProblem);
    vi.mocked(roomService.getById).mockResolvedValue(mockRoom);
  });

  it('renders AppHeader with problem title and room turma subtitle', async () => {
    renderPage();

    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: 'Problema 1 - Prontuário Eletrônico',
      }),
    ).toBeInTheDocument();
    expect(screen.getByText('Turma A')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /voltar para a sessão/i })).toHaveAttribute(
      'href',
      '/turmas/room-1/problemas/prob-1/sessoes/sess-1',
    );
  });

  it('renders title and subtitle from location state immediately when available', async () => {
    render(
      <AuthContext.Provider
        value={{
          user: mockTeacher,
          isAuthenticated: true,
          login: vi.fn(),
          logout: vi.fn(),
        }}
      >
        <MemoryRouter
          initialEntries={[
            {
              pathname: '/turmas/room-1/problemas/prob-1/sessoes/sess-1/relatorio',
              state: {
                problemTitle: 'Problema 1 - Prontuário Eletrônico',
                roomTurma: 'Turma A',
              },
            },
          ]}
        >
          <Routes>
            <Route
              path="/turmas/:roomId/problemas/:problemId/sessoes/:sessionId/relatorio"
              element={<SessionReportPage />}
            />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>,
    );

    expect(
      screen.getByRole('heading', { level: 1, name: 'Problema 1 - Prontuário Eletrônico' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Turma A')).toBeInTheDocument();
    await screen.findByRole('heading', {
      level: 1,
      name: 'Problema 1 - Prontuário Eletrônico',
    });
  });
});
