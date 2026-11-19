import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { sessionService } from '@/services/session.service';
import type { SessionGeneralEvaluation } from '@/types/session';
import { SessionGeneralEvaluationCard } from './SessionGeneralEvaluationCard';

vi.mock('@/services/session.service', () => ({
  sessionService: {
    getGeneralEvaluations: vi.fn(),
    saveGeneralEvaluation: vi.fn(),
  },
}));

const mockNotify = vi.fn();
vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({ notify: mockNotify }),
}));

let mockUser = { id: 'prof-1', nome: 'Prof. Carlos', tipo: 'PROFESSOR' };
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: mockUser }),
}));

const mockEvaluation: SessionGeneralEvaluation = {
  id: 'eval-1',
  texto: 'Excelente dinâmica e participação coletiva.',
  autor: { id: 'prof-1', nome: 'Prof. Carlos' },
  criadoEm: '2026-04-12T10:00:00Z',
  editadoEm: '2026-04-12T11:30:00Z',
};

describe('SessionGeneralEvaluationCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUser = { id: 'prof-1', nome: 'Prof. Carlos', tipo: 'PROFESSOR' };
  });

  it('renders card header and empty invitation state for professor', async () => {
    vi.mocked(sessionService.getGeneralEvaluations).mockResolvedValueOnce([]);

    render(<SessionGeneralEvaluationCard sessionId="sess-1" isProfessor={true} />);

    expect(await screen.findByText('Feedback Geral da Sessão')).toBeInTheDocument();
    expect(
      screen.getByText('Nenhum feedback geral registrado para a turma ainda.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Registrar feedback' })).toBeInTheDocument();
  });

  it('applies custom className to root container', async () => {
    vi.mocked(sessionService.getGeneralEvaluations).mockResolvedValueOnce([]);

    const { container } = render(
      <SessionGeneralEvaluationCard
        sessionId="sess-1"
        isProfessor={true}
        className="lg:col-span-2"
      />,
    );

    expect(await screen.findByText('Feedback Geral da Sessão')).toBeInTheDocument();
    expect(container.firstChild).toHaveClass('lg:col-span-2');
  });

  it('opens registration modal when clicking register button', async () => {
    const user = userEvent.setup();
    vi.mocked(sessionService.getGeneralEvaluations).mockResolvedValueOnce([]);

    render(<SessionGeneralEvaluationCard sessionId="sess-1" isProfessor={true} />);

    const registerBtn = await screen.findByRole('button', { name: 'Registrar feedback' });
    await user.click(registerBtn);

    expect(
      await screen.findByText('Consolidado de feedback para todos os alunos na sessão'),
    ).toBeInTheDocument();
  });

  it('renders evaluation summary with author and edit button for the author', async () => {
    vi.mocked(sessionService.getGeneralEvaluations).mockResolvedValueOnce([mockEvaluation]);

    render(<SessionGeneralEvaluationCard sessionId="sess-1" isProfessor={true} />);

    expect(
      await screen.findByText('Excelente dinâmica e participação coletiva.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Prof. Carlos')).toBeInTheDocument();
    expect(screen.getByText('(você)')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Editar feedback geral' })).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Registrar meu feedback' }),
    ).not.toBeInTheDocument();
  });

  it('allows co-tutor to view other tutor feedback and register their own feedback', async () => {
    mockUser = { id: 'prof-cotutor-2', nome: 'Profa. Fernanda', tipo: 'PROFESSOR' };
    vi.mocked(sessionService.getGeneralEvaluations).mockResolvedValueOnce([mockEvaluation]);

    render(<SessionGeneralEvaluationCard sessionId="sess-1" isProfessor={true} />);

    expect(
      await screen.findByText('Excelente dinâmica e participação coletiva.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Editar feedback geral' })).not.toBeInTheDocument();

    const addMyFeedbackBtn = screen.getByRole('button', { name: 'Registrar meu feedback' });
    expect(addMyFeedbackBtn).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(addMyFeedbackBtn);

    expect(
      await screen.findByText('Consolidado de feedback para todos os alunos na sessão'),
    ).toBeInTheDocument();
  });

  it('renders unavailable notice for student when no evaluation exists', async () => {
    mockUser = { id: 'student-1', nome: 'Aluno João', tipo: 'ALUNO' };
    vi.mocked(sessionService.getGeneralEvaluations).mockResolvedValueOnce([]);

    render(<SessionGeneralEvaluationCard sessionId="sess-1" isProfessor={false} />);

    expect(
      await screen.findByText('O feedback geral da sessão ainda não está disponível.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Registrar/i })).not.toBeInTheDocument();
  });

  it('renders read-only evaluation for student without edit buttons', async () => {
    mockUser = { id: 'student-1', nome: 'Aluno João', tipo: 'ALUNO' };
    vi.mocked(sessionService.getGeneralEvaluations).mockResolvedValueOnce([mockEvaluation]);

    render(<SessionGeneralEvaluationCard sessionId="sess-1" isProfessor={false} />);

    expect(
      await screen.findByText('Excelente dinâmica e participação coletiva.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Prof. Carlos')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Editar/i })).not.toBeInTheDocument();
  });

  it('displays error and allows retrying upon fetch failure', async () => {
    const user = userEvent.setup();
    vi.mocked(sessionService.getGeneralEvaluations)
      .mockRejectedValueOnce(new Error('Falha ao conectar com o servidor.'))
      .mockResolvedValueOnce([mockEvaluation]);

    render(<SessionGeneralEvaluationCard sessionId="sess-1" isProfessor={true} />);

    expect(await screen.findByText('Falha ao conectar com o servidor.')).toBeInTheDocument();
    const retryBtn = screen.getByRole('button', { name: 'Tentar novamente' });
    await user.click(retryBtn);

    expect(
      await screen.findByText('Excelente dinâmica e participação coletiva.'),
    ).toBeInTheDocument();
  });
});
