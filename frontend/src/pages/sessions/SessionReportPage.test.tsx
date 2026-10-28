import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthContext } from '@/contexts/authContext';
import { sessionService } from '@/services/session.service';
import type { UserResponse } from '@/types/auth';
import type { Session } from '@/types/session';
import type { SessionReportStudent } from '@/types/sessionReport';
import { SessionReportPage } from './SessionReportPage';

vi.mock('@/services/session.service', () => ({
  sessionService: {
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

const mockSession: Session = {
  id: 'sess-1',
  titulo: 'Sessão 1 - Abertura',
  descricao: 'Primeiro encontro tutorial',
  data: '2026-10-01',
  ordem: 1,
  status: 'agendada',
};

const mockStudents: SessionReportStudent[] = [
  {
    id: 'student-1',
    nome: 'Ana Souza',
    matricula: '20240001',
    notaFinal: 6.5,
  },
  {
    id: 'student-2',
    nome: 'João Silva',
    matricula: '20240002',
    notaFinal: 8.0,
  },
];

function renderPage(
  initialEntry = '/turmas/room-1/problemas/prob-1/sessoes/sess-1/relatorio',
  students?: SessionReportStudent[],
) {
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
            element={<SessionReportPage students={students} />}
          />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

describe('SessionReportPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(sessionService.getById).mockResolvedValue(mockSession);
  });

  describe('Cabeçalho', () => {
    it('renders fixed title "Relatório da Sessão" and session subtitle in AppHeader', async () => {
      renderPage();

      expect(
        await screen.findByRole('heading', {
          level: 1,
          name: 'Relatório da Sessão',
        }),
      ).toBeInTheDocument();
      expect(screen.getByText('Sessão 1 - Abertura')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /voltar para a sessão/i })).toHaveAttribute(
        'href',
        '/turmas/room-1/problemas/prob-1/sessoes/sess-1',
      );
    });

    it('renders session subtitle from location state immediately', async () => {
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
                state: { sessionTitle: 'Sessão 1 - Abertura' },
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

      expect(screen.getByText('Sessão 1 - Abertura')).toBeInTheDocument();
      await screen.findByRole('heading', { level: 1, name: 'Relatório da Sessão' });
    });
  });

  describe('Tabela de Notas', () => {
    it('renders initial table correctly with mock students, ALUNO header, and Ocultar nomes label', async () => {
      renderPage(undefined, mockStudents);

      expect(await screen.findByText('Sessão 1 - Abertura')).toBeInTheDocument();
      expect(screen.getByText('ALUNO')).toBeInTheDocument();
      expect(screen.getByText('NOTA FINAL')).toBeInTheDocument();
      expect(screen.getByText('Ocultar nomes')).toBeInTheDocument();
      expect(screen.getByText('Ana Souza')).toBeInTheDocument();
      expect(screen.getByText('João Silva')).toBeInTheDocument();
    });

    it('toggles name masking to matricula when clicking Ocultar nomes switch', async () => {
      const user = userEvent.setup();
      renderPage(undefined, mockStudents);

      expect(await screen.findByText('Sessão 1 - Abertura')).toBeInTheDocument();
      const toggle = screen.getByRole('switch', { name: /ocultar nomes/i });
      await user.click(toggle);

      expect(screen.getByText('MATRÍCULA')).toBeInTheDocument();
      expect(screen.queryByText('ALUNO')).not.toBeInTheDocument();
      expect(screen.queryByText('Ana Souza')).not.toBeInTheDocument();
      expect(screen.queryByText('João Silva')).not.toBeInTheDocument();
      expect(screen.getByText('20240001')).toBeInTheDocument();
      expect(screen.getByText('20240002')).toBeInTheDocument();
    });

    it('applies red color for grade < 7.0 and green color for grade >= 7.0', async () => {
      renderPage(undefined, mockStudents);

      expect(await screen.findByText('Sessão 1 - Abertura')).toBeInTheDocument();
      const lowGradeCell = screen.getByText('6,5');
      expect(lowGradeCell).toHaveClass('text-red-600');

      const highGradeCell = screen.getByText('8,0');
      expect(highGradeCell).toHaveClass('text-green-600');
    });

    it('calculates and renders the mathematically correct class average in table footer with neutral color', async () => {
      renderPage(undefined, mockStudents);

      expect(await screen.findByText('Sessão 1 - Abertura')).toBeInTheDocument();
      expect(screen.getByText('Média da turma')).toBeInTheDocument();
      // (6.5 + 8.0) / 2 = 7.25 -> formatGrade(7.25) = '7,3'
      const avgCell = screen.getByText('7,3');
      expect(avgCell).toBeInTheDocument();
      expect(avgCell).toHaveClass('text-ink', 'font-bold');
      expect(avgCell).not.toHaveClass('text-green-600');
      expect(avgCell).not.toHaveClass('text-red-600');
    });
  });
});
