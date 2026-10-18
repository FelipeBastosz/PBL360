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

// jsdom's Blob has no text(), so read it with FileReader.
function readBlob(blob: Blob): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.readAsText(blob);
  });
}

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
    window.localStorage.clear();
    vi.mocked(evaluationHistoryService.list).mockResolvedValue({ alunos: students });
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
    expect(evaluationHistoryService.list).toHaveBeenCalledWith('sess-1');
  });

  it('opens the adjustment sheet only from the photo of a submitted evaluation', async () => {
    renderPage();
    await screen.findByRole('heading', { name: 'Elisa Nunes' });

    expect(within(cardOf('Bruno Mendes')).queryByRole('button')).not.toBeInTheDocument();
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

  it('shows the registration number instead of the name when names are hidden', async () => {
    renderPage();
    await screen.findByText('Elisa Nunes');

    await userEvent.click(screen.getByRole('switch', { name: 'Ocultar nomes' }));

    expect(screen.getByText('26121194')).toBeInTheDocument();
    expect(screen.queryByText('Elisa Nunes')).not.toBeInTheDocument();
    expect(window.localStorage.getItem('pbl360:evaluation-history:hide-names')).toBe('true');
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
    expect(screen.getByRole('button', { name: /exportar em pdf/i })).toBeDisabled();
  });

  it('exports the data as a CSV file for Excel', async () => {
    // jsdom does not implement object URLs.
    const createObjectURL = vi.fn((_blob: Blob) => 'blob:history');
    Object.assign(URL, { createObjectURL, revokeObjectURL: vi.fn() });
    renderPage();
    await screen.findByText('Elisa Nunes');

    await userEvent.click(screen.getByRole('button', { name: /exportar em excel/i }));

    const csv = await readBlob(createObjectURL.mock.calls[0][0]);
    expect(csv).toContain('Matrícula;Nome;Nota do aluno;Nota do tutor;Situação');
    expect(csv).toContain('26121192;Carla Rocha;9,5;8,5;Ajustada com justificativa');
    expect(csv).toContain('26121191;Bruno Mendes;;;Avaliação pendente');
  });
});
