import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import ProblemGradesPage from './ProblemGradesPage';
import { gradesService } from '@/services/grades.service';
import { feedbackService } from '@/services/feedback.service';
import { memberRoomService } from '@/services/memberRoom.service';
import { problemService } from '@/services/problem.service';
import type { ProblemGradesResponse } from '@/types/grades';
import type { ProblemFeedbacksResponse } from '@/types/feedback';

vi.mock('@/services/grades.service', () => ({
  gradesService: { getProblemGrades: vi.fn() },
}));

vi.mock('@/services/feedback.service', () => ({
  feedbackService: {
    getProblemFeedbacks: vi.fn(),
    saveStudentFeedback: vi.fn(),
    saveGeneralFeedback: vi.fn(),
  },
}));

vi.mock('@/services/memberRoom.service', () => ({
  memberRoomService: { room: vi.fn(), problem: vi.fn() },
}));

vi.mock('@/services/problem.service', () => ({
  problemService: { exportReport: vi.fn() },
}));

const mockNotify = vi.fn();
vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({ notify: mockNotify }),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'prof-1', nome: 'Professor Silva', tipo: 'PROFESSOR', possuiFoto: false },
    isAuthenticated: true,
  }),
}));

const mockGrades: ProblemGradesResponse = {
  sessoes: [
    { id: 'sess-1', rotulo: 'S1', data: '2026-10-01' },
    { id: 'sess-2', rotulo: 'S2', data: '2026-10-05' },
    { id: 'sess-3', rotulo: 'S3', data: '2026-10-10' },
  ],
  alunos: [
    {
      alunoId: 'aluno-1',
      nome: 'Ana Silva',
      matricula: '26121190',
      sessoes: [
        { sessaoId: 'sess-1', nota: 8.5, situacao: 'AVALIADA' },
        { sessaoId: 'sess-2', nota: 9.0, situacao: 'AVALIADA' },
        { sessaoId: 'sess-3', nota: 8.2, situacao: 'AVALIADA' },
      ],
      notaFinal: 8.6,
    },
    {
      alunoId: 'aluno-2',
      nome: 'Bruno Mendes',
      matricula: '26121191',
      sessoes: [
        { sessaoId: 'sess-1', nota: null, situacao: 'PENDENTE' },
        { sessaoId: 'sess-2', nota: null, situacao: 'JUSTIFICADA' },
        { sessaoId: 'sess-3', nota: 0.0, situacao: 'AUSENTE' },
      ],
      notaFinal: 7.0,
    },
  ],
  mediaTurma: 7.8,
  versoesFormula: { sessao: 1, problema: 1 },
};

const mockFeedbacks: ProblemFeedbacksResponse = {
  geral: null,
  alunos: [
    { alunoId: 'aluno-1', nome: 'Ana Silva', feedback: null },
    { alunoId: 'aluno-2', nome: 'Bruno Mendes', feedback: null },
  ],
};

function renderPage(roomId = 'room-1', problemId = 'prob-1') {
  return render(
    <MemoryRouter initialEntries={[`/turmas/${roomId}/problemas/${problemId}/notas`]}>
      <Routes>
        <Route path="/turmas/:roomId/problemas/:problemId/notas" element={<ProblemGradesPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ProblemGradesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(memberRoomService.room).mockResolvedValue({
      id: 'room-1',
      nome: 'MI - Algoritmos - TP02',
    });
    vi.mocked(memberRoomService.problem).mockResolvedValue({ id: 'prob-1', titulo: 'Problema 01' });
    vi.mocked(gradesService.getProblemGrades).mockResolvedValue(mockGrades);
    vi.mocked(feedbackService.getProblemFeedbacks).mockResolvedValue(mockFeedbacks);
  });

  it('loads problem data and renders problem title, grades table, and action buttons', async () => {
    renderPage();

    expect(await screen.findByText('Problema 01')).toBeInTheDocument();
    expect(screen.getByText('TP02')).toBeInTheDocument();
    expect(screen.getByText('Ana Silva')).toBeInTheDocument();
    expect(screen.getByText('Bruno Mendes')).toBeInTheDocument();
    expect(screen.getByText('Média da turma')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Feedback geral da turma' })).toBeInTheDocument();
  });

  it('downloads PDF report when clicking "Exportar em PDF"', async () => {
    const user = userEvent.setup();
    const fakeBlob = new Blob(['pdf-content'], { type: 'application/pdf' });
    vi.mocked(problemService.exportReport).mockResolvedValue(fakeBlob);

    // Mock createObjectURL
    window.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-url');
    window.URL.revokeObjectURL = vi.fn();

    renderPage('room-1', 'prob-1');

    const pdfBtn = await screen.findByRole('button', { name: 'Exportar em PDF' });
    expect(pdfBtn).not.toBeDisabled();

    await user.click(pdfBtn);

    expect(problemService.exportReport).toHaveBeenCalledWith('room-1', 'prob-1', 'PDF');
    expect(window.URL.createObjectURL).toHaveBeenCalledWith(fakeBlob);
  });

  it('downloads Excel report when clicking "Exportar em Excel"', async () => {
    const user = userEvent.setup();
    const fakeBlob = new Blob(['xlsx-content'], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    vi.mocked(problemService.exportReport).mockResolvedValue(fakeBlob);

    window.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-url');
    window.URL.revokeObjectURL = vi.fn();

    renderPage('room-1', 'prob-1');

    const excelBtn = await screen.findByRole('button', { name: 'Exportar em Excel' });
    expect(excelBtn).not.toBeDisabled();

    await user.click(excelBtn);

    expect(problemService.exportReport).toHaveBeenCalledWith('room-1', 'prob-1', 'XLSX');
    expect(window.URL.createObjectURL).toHaveBeenCalledWith(fakeBlob);
  });

  it('shows error toast when export fails', async () => {
    const user = userEvent.setup();
    vi.mocked(problemService.exportReport).mockRejectedValue(new Error('Erro ao gerar relatório.'));

    renderPage('room-1', 'prob-1');

    const pdfBtn = await screen.findByRole('button', { name: 'Exportar em PDF' });
    await user.click(pdfBtn);

    await waitFor(() => {
      expect(mockNotify).toHaveBeenCalledWith({
        tone: 'error',
        message: 'Ocorreu um erro inesperado. Tente novamente.',
      });
    });
  });

  it('toggles name privacy between student name and registration number', async () => {
    const user = userEvent.setup();
    renderPage();

    expect(await screen.findByText('Ana Silva')).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'ALUNO' })).toBeInTheDocument();

    const toggle = screen.getByRole('switch', { name: 'Ocultar nomes' });
    await user.click(toggle);

    expect(screen.getByRole('columnheader', { name: 'MATRÍCULA' })).toBeInTheDocument();
    expect(screen.getByText('26121190')).toBeInTheDocument();
    expect(screen.queryByText('Ana Silva')).not.toBeInTheDocument();
  });
});
