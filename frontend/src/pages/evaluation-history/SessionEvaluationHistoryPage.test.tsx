import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthContext } from '@/contexts/authContext';
import { ApiError } from '@/services/apiError';
import { evaluationService } from '@/services/evaluation.service';
import { evaluationHistoryService } from '@/services/evaluationHistory.service';
import type { UserResponse } from '@/types/auth';
import type { StudentEvaluationHistoryItem } from '@/types/evaluationHistory';
import SessionEvaluationHistoryPage from './SessionEvaluationHistoryPage';

vi.mock('@/services/evaluationHistory.service', () => ({
  evaluationHistoryService: { list: vi.fn() },
}));
vi.mock('@/services/evaluation.service', () => ({
  evaluationService: { adjustSelfAssessment: vi.fn() },
}));
const notify = vi.fn();
vi.mock('@/hooks/useToast', () => ({ useToast: () => ({ notify }) }));
vi.mock('@/services/user.service', () => ({
  userService: { getPhoto: vi.fn().mockResolvedValue(new Blob()) },
}));

const mockTeacher: UserResponse = {
  id: 'tutor-1',
  nome: 'Professor Silva',
  email: 'prof@test.com',
  tipo: 'PROFESSOR',
  matricula: null,
  possuiFoto: false,
  ativo: true,
  criadoEm: '2026-01-01',
};

const students: StudentEvaluationHistoryItem[] = [
  {
    alunoId: 'aluno-1',
    nome: 'Elisa Nunes',
    matricula: '26121194',
    notaAluno: 8,
    notaAlunoOriginal: null,
    notaTutor: 7,
    notaPares: 8,
    avaliacoesPares: 2,
    situacaoAjuste: 'SEM_AJUSTE',
  },
  {
    alunoId: 'aluno-2',
    nome: 'Carla Rocha',
    matricula: '26121192',
    notaAluno: 8.5,
    notaAlunoOriginal: 9.5,
    notaTutor: 8,
    notaPares: 9,
    avaliacoesPares: 2,
    situacaoAjuste: 'AJUSTADA',
  },
  {
    alunoId: 'aluno-3',
    nome: 'Bruno Mendes',
    matricula: '26121191',
    notaAluno: null,
    notaAlunoOriginal: null,
    notaTutor: null,
    notaPares: null,
    avaliacoesPares: 0,
    situacaoAjuste: 'SEM_AJUSTE',
  },
];

function renderPage() {
  return render(
    <AuthContext.Provider
      value={{ user: mockTeacher, isAuthenticated: true, login: vi.fn(), logout: vi.fn() }}
    >
      <MemoryRouter initialEntries={['/turmas/room-1/problemas/prob-1/sessoes/sess-1/historico']}>
        <Routes>
          <Route
            path="/turmas/:roomId/problemas/:problemId/sessoes/:sessionId/historico"
            element={<SessionEvaluationHistoryPage />}
          />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

function cardOf(name: string) {
  return screen.getByRole('heading', { name }).closest('article') as HTMLElement;
}

describe('SessionEvaluationHistoryPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(evaluationHistoryService.list).mockResolvedValue({ alunos: students });
  });

  it('shows every score with a single decimal place and a comma', async () => {
    vi.mocked(evaluationHistoryService.list).mockResolvedValue({
      alunos: [{ ...students[0], notaAluno: 8.25, notaTutor: 7.333 }],
    });
    renderPage();

    await screen.findByRole('heading', { name: 'Elisa Nunes' });
    const elisa = cardOf('Elisa Nunes');
    expect(within(elisa).getByText('8,3')).toBeInTheDocument();
    expect(within(elisa).getByText('7,3')).toBeInTheDocument();
    expect(elisa).not.toHaveTextContent(/\d[.,]\d{2}/);
  });

  it('compares the student score with the tutor adjustment', async () => {
    renderPage();

    await screen.findByRole('heading', { name: 'Elisa Nunes' });
    const elisa = cardOf('Elisa Nunes');
    expect(within(elisa).getByText('Sem ajuste do tutor')).toBeInTheDocument();
    expect(within(elisa).getByText('8,0')).toBeInTheDocument();
    expect(within(elisa).getByText('7,0')).toBeInTheDocument();

    const carla = cardOf('Carla Rocha');
    expect(within(carla).getByText('Ajustada com justificativa')).toBeInTheDocument();
    expect(within(carla).getByText('9,5')).toBeInTheDocument();
    expect(within(carla).getByText('8,5')).toBeInTheDocument();

    expect(within(cardOf('Bruno Mendes')).getByText('Avaliação pendente')).toBeInTheDocument();
    expect(within(cardOf('Bruno Mendes')).getByText('Aluno')).toBeInTheDocument();
    expect(evaluationHistoryService.list).toHaveBeenCalledWith('sess-1');
  });

  it('displays "Pares" when peer evaluation is submitted without self-assessment', async () => {
    vi.mocked(evaluationHistoryService.list).mockResolvedValue({
      alunos: [
        {
          alunoId: 'aluno-4',
          nome: 'Diego Alves',
          matricula: '26121199',
          notaAluno: null,
          notaAlunoOriginal: null,
          notaTutor: null,
          notaPares: 8.5,
          avaliacoesPares: 3,
          situacaoAjuste: 'SEM_AJUSTE',
        },
      ],
    });
    renderPage();

    await screen.findByRole('heading', { name: 'Diego Alves' });
    const diego = cardOf('Diego Alves');
    expect(within(diego).getByText('Pares')).toBeInTheDocument();
    expect(within(diego).getByText('8,5')).toBeInTheDocument();
  });

  it('opens the adjustment sheet when clicking the student card', async () => {
    renderPage();
    await screen.findByRole('heading', { name: 'Elisa Nunes' });

    expect(
      within(cardOf('Bruno Mendes')).getByRole('button', { name: 'Ajustar nota de Bruno Mendes' }),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Ajustar nota de Elisa Nunes' }));

    expect(screen.getByRole('dialog', { name: 'Elisa Nunes' })).toBeInTheDocument();
  });

  it('saves the adjustment and shows the new tutor score on the card', async () => {
    vi.mocked(evaluationService.adjustSelfAssessment).mockResolvedValue({
      alunoId: 'aluno-1',
      notaOriginal: 8,
      notaVigente: 6.5,
      ajuste: {
        valorAnterior: 8,
        valorNovo: 6.5,
        justificativa: 'Revisado após conversa com o aluno.',
        autor: { id: 'tutor-1', nome: 'Professor Silva' },
        ajustadoEm: '2026-10-15T12:00:00Z',
      },
    });
    renderPage();
    await userEvent.click(
      await screen.findByRole('button', { name: 'Ajustar nota de Elisa Nunes' }),
    );

    const grade = screen.getByLabelText('Nova nota');
    await userEvent.clear(grade);
    await userEvent.type(grade, '6.5');
    await userEvent.type(
      screen.getByLabelText('Justificativa do ajuste'),
      'Revisado após conversa com o aluno.',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Salvar ajuste' }));

    expect(evaluationService.adjustSelfAssessment).toHaveBeenCalledWith('sess-1', 'aluno-1', {
      novaNota: 6.5,
      justificativa: 'Revisado após conversa com o aluno.',
    });
    expect(await within(cardOf('Elisa Nunes')).findByText('6,5')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens modal with informational alert and saves adjustment for peer assessment', async () => {
    vi.mocked(evaluationHistoryService.list).mockResolvedValue({
      alunos: [
        {
          alunoId: 'aluno-4',
          nome: 'Diego Alves',
          matricula: '26121199',
          notaAluno: null,
          notaAlunoOriginal: null,
          notaTutor: null,
          notaPares: 8.5,
          avaliacoesPares: 3,
          situacaoAjuste: 'SEM_AJUSTE',
        },
      ],
    });
    vi.mocked(evaluationService.adjustSelfAssessment).mockResolvedValue({
      alunoId: 'aluno-4',
      notaOriginal: 8.5,
      notaVigente: 9.0,
      ajuste: {
        valorAnterior: 8.5,
        valorNovo: 9.0,
        justificativa: 'Nota revisada pelo tutor.',
        autor: { id: 'tutor-1', nome: 'Professor Silva' },
        ajustadoEm: '2026-10-15T12:00:00Z',
      },
    });

    renderPage();
    await screen.findByRole('heading', { name: 'Diego Alves' });

    await userEvent.click(screen.getByRole('button', { name: 'Ajustar nota de Diego Alves' }));

    expect(
      screen.getByText(
        'A avaliação por pares está em andamento. Inserir uma nota sobrescreverá a média dos pares.',
      ),
    ).toBeInTheDocument();

    const grade = screen.getByLabelText('Nova nota');
    await userEvent.clear(grade);
    await userEvent.type(grade, '9.0');
    await userEvent.type(
      screen.getByLabelText('Justificativa do ajuste'),
      'Nota revisada pelo tutor.',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Salvar ajuste' }));

    expect(evaluationService.adjustSelfAssessment).toHaveBeenCalledWith('sess-1', 'aluno-4', {
      novaNota: 9.0,
      justificativa: 'Nota revisada pelo tutor.',
      tipo: 'PARES',
    });
  });

  it('shows an error when the history cannot be loaded', async () => {
    vi.mocked(evaluationHistoryService.list).mockRejectedValue(
      new ApiError(403, ['Você não tem acesso a esta sessão.']),
    );
    renderPage();

    expect(await screen.findByText('Você não tem acesso a esta sessão.')).toBeInTheDocument();
  });

  it('shows the empty state when no student attended the session', async () => {
    vi.mocked(evaluationHistoryService.list).mockResolvedValue({ alunos: [] });
    renderPage();

    expect(
      await screen.findByText('Nenhum aluno com presença registrada nesta sessão.'),
    ).toBeInTheDocument();
  });
});
