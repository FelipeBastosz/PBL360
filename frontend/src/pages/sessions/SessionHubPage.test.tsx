import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthContext } from '@/contexts/authContext';
import { ApiError } from '@/services/apiError';
import { problemService } from '@/services/problem.service';
import { sessionService } from '@/services/session.service';
import type { UserResponse } from '@/types/auth';
import type { Problem } from '@/types/problem';
import type { Session, SessionReleasesResponse } from '@/types/session';
import SessionHubPage from './SessionHubPage';

vi.mock('@/services/problem.service', () => ({
  problemService: { getById: vi.fn() },
}));

vi.mock('@/services/session.service', () => ({
  sessionService: {
    getById: vi.fn(),
    getForMember: vi.fn(),
    listAttachments: vi.fn().mockResolvedValue([]),
    getReleases: vi.fn(),
  },
}));

vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({ notify: vi.fn() }),
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
  titulo: 'Problema 01 - Diagnóstico',
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

const mockSession: Session = {
  id: 'sess-1',
  titulo: 'Sessão 1',
  descricao: 'Primeiro encontro tutorial',
  data: '2026-08-12',
  ordem: 1,
  status: 'agendada',
};

const mockReleases: SessionReleasesResponse = {
  autoavaliacao: { liberada: false, prazo: null, enviadas: 0, esperadas: 10 },
  pares: { liberada: false, prazo: null, enviadas: 0, esperadas: 10 },
  atualizadoEm: '2026-01-01T00:00:00.000Z',
  atualizadoPor: 'tutor-1',
};

const mockStudent: UserResponse = {
  ...mockTeacher,
  id: '2',
  nome: 'Aluno Ciclano',
  email: 'aluno@test.com',
  tipo: 'ALUNO',
  matricula: '123456',
};

function renderPage(user: UserResponse = mockTeacher) {
  return render(
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: true,
        login: vi.fn(),
        logout: vi.fn(),
      }}
    >
      <MemoryRouter initialEntries={['/turmas/room-1/problemas/prob-1/sessoes/sess-1']}>
        <Routes>
          <Route
            path="/turmas/:roomId/problemas/:problemId/sessoes/:sessionId"
            element={<SessionHubPage />}
          />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

describe('SessionHubPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(problemService.getById).mockResolvedValue(mockProblem);
    vi.mocked(sessionService.getById).mockResolvedValue(mockSession);
    vi.mocked(sessionService.getReleases).mockResolvedValue(mockReleases);
  });

  it('renders header with session title, formatted date, problem subtitle and user initials', async () => {
    renderPage();

    expect(await screen.findByText(/Sessão 1 · 12 ago/i)).toBeInTheDocument();
    expect(screen.getByText('Problema 01 - Diagnóstico')).toBeInTheDocument();
    expect(screen.getByText('PF')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /voltar para as sessões/i })).toHaveAttribute(
      'href',
      '/turmas/room-1/problemas/prob-1',
    );
  });

  it('renders active action links for Chamada, Avaliar alunos, and Fórmulas', async () => {
    renderPage();

    const basePath = '/turmas/room-1/problemas/prob-1/sessoes/sess-1';

    expect(await screen.findByRole('link', { name: /chamada/i })).toHaveAttribute(
      'href',
      `${basePath}/chamada`,
    );
    expect(screen.getByRole('link', { name: /avaliar alunos/i })).toHaveAttribute(
      'href',
      `${basePath}/avaliar`,
    );
    expect(screen.getByRole('link', { name: /fórmulas/i })).toHaveAttribute('href', '/formulas');
  });

  it('renders active link for Histórico de avaliações', async () => {
    renderPage();

    const basePath = '/turmas/room-1/problemas/prob-1/sessoes/sess-1';
    const link = await screen.findByRole('link', { name: /histórico de avaliações/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', `${basePath}/historico`);
  });

  it('renders Autoavaliação e pares card with toggle switches', async () => {
    renderPage();

    expect(await screen.findByText('Autoavaliação e pares')).toBeInTheDocument();
    expect(screen.getByText('Autoavaliação dos alunos')).toBeInTheDocument();
    expect(screen.getByText('Avaliação entre pares')).toBeInTheDocument();
    expect(screen.getAllByRole('switch')).toHaveLength(2);
  });

  it('renders Encerrar sessão button as disabled', async () => {
    renderPage();

    const endBtn = await screen.findByRole('button', { name: 'Encerrar sessão' });
    expect(endBtn).toBeInTheDocument();
    expect(endBtn).toBeDisabled();
  });

  describe('when user is a student', () => {
    beforeEach(() => {
      vi.mocked(sessionService.getForMember).mockResolvedValue({
        ...mockSession,
        problemaId: 'prob-1',
        salaId: 'room-1',
        problemaTitulo: 'Problema 01 - Diagnóstico',
      });
    });

    it('shows the session header and its attachments, without the tutor actions', async () => {
      renderPage(mockStudent);

      expect(await screen.findByText(/Sessão 1 · 12 ago/i)).toBeInTheDocument();
      expect(screen.getByText('Problema 01 - Diagnóstico')).toBeInTheDocument();
      expect(await screen.findByRole('heading', { name: 'Anexos da Sessão' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Adicionar Documento/ })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Central de Avaliações' })).toBeInTheDocument();
      expect(screen.getByText('Autoavaliação')).toBeInTheDocument();
      expect(screen.getByText('Avaliar Colegas')).toBeInTheDocument();
      expect(screen.getByText('Notas e Feedbacks')).toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /chamada/i })).not.toBeInTheDocument();
      expect(screen.queryByText('Autoavaliação e pares')).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Encerrar sessão' })).not.toBeInTheDocument();
      expect(sessionService.getById).not.toHaveBeenCalled();
      expect(problemService.getById).not.toHaveBeenCalled();
    });

    it('explains when the student cannot open the session', async () => {
      vi.mocked(sessionService.getForMember).mockRejectedValue(
        new ApiError(403, ['Você não participa desta sala.']),
      );
      renderPage(mockStudent);

      expect(await screen.findByRole('alert')).toHaveTextContent('Você não participa desta sala.');
    });
  });
});
