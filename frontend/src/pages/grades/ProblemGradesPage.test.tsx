import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import ProblemGradesPage from './ProblemGradesPage';
import { gradesService } from '@/services/grades.service';
import { feedbackService } from '@/services/feedback.service';
import { memberRoomService } from '@/services/memberRoom.service';
import type { ProblemGradesResponse } from '@/types/grades';
import type { ProblemFeedbacksResponse } from '@/types/feedback';

vi.mock('@/services/grades.service', () => ({
  gradesService: {
    getProblemGrades: vi.fn(),
  },
}));

vi.mock('@/services/feedback.service', () => ({
  feedbackService: {
    getProblemFeedbacks: vi.fn(),
    saveStudentFeedback: vi.fn(),
    saveGeneralFeedback: vi.fn(),
  },
}));

vi.mock('@/services/memberRoom.service', () => ({
  memberRoomService: {
    room: vi.fn(),
    problem: vi.fn(),
  },
}));

vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({ notify: vi.fn() }),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'prof-1', nome: 'Professor Silva', tipo: 'PROFESSOR', possuiFoto: false },
    isAuthenticated: true,
  }),
}));

const mockGrades: ProblemGradesResponse = {
  sessoes: [
    { id: 'sess-1', rotulo: 'S1', data: '01-10-2026' },
    { id: 'sess-2', rotulo: 'S2', data: '05-10-2026' },
    { id: 'sess-3', rotulo: 'S3', data: '10-10-2026' },
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
    {
      alunoId: 'aluno-1',
      nome: 'Ana Silva',
      feedback: null,
    },
    {
      alunoId: 'aluno-2',
      nome: 'Bruno Mendes',
      feedback: null,
    },
  ],
};

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/turmas/room-1/problemas/prob-1/notas']}>
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
    vi.mocked(memberRoomService.problem).mockResolvedValue({
      id: 'prob-1',
      titulo: 'Problema 01',
    });
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

  it('renders disabled export buttons with tooltip "Em breve"', async () => {
    renderPage();

    const pdfBtn = await screen.findByRole('button', { name: 'Exportar em PDF' });
    const excelBtn = screen.getByRole('button', { name: 'Exportar em Excel' });

    expect(pdfBtn).toBeDisabled();
    expect(excelBtn).toBeDisabled();
    expect(pdfBtn).toHaveAttribute('title', 'Em breve');
    expect(excelBtn).toHaveAttribute('title', 'Em breve');

    const tooltips = screen.getAllByRole('tooltip');
    expect(tooltips).toHaveLength(2);
    expect(tooltips[0]).toHaveTextContent('Em breve');
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

  it('opens student feedback modal when clicking on a grade cell, inheriting privacy settings', async () => {
    const user = userEvent.setup();
    renderPage();

    // With names visible
    const gradeCell = await screen.findByRole('button', { name: /Ana Silva.*S1/i });
    await user.click(gradeCell);

    const dialog = screen.getByRole('dialog', { name: 'Feedback - S1' });
    expect(dialog).toBeInTheDocument();
    expect(screen.getByLabelText(/nota/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/comentário de feedback/i)).toBeInTheDocument();

    // Close modal
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));

    // Now enable hideNames
    const toggle = screen.getByRole('switch', { name: 'Ocultar nomes' });
    await user.click(toggle);

    // Click grade cell again (now aria-label has matricula)
    const gradeCellHidden = screen.getByRole('button', { name: /26121190.*S1/i });
    await user.click(gradeCellHidden);

    // Modal title should use sessionName
    expect(screen.getByRole('dialog', { name: 'Feedback - S1' })).toBeInTheDocument();
  });

  it('opens general feedback modal when clicking "Feedback geral da turma"', async () => {
    const user = userEvent.setup();
    renderPage();

    const generalBtn = await screen.findByRole('button', {
      name: 'Feedback geral da turma',
    });
    await user.click(generalBtn);

    const dialog = screen.getByRole('dialog', { name: 'Feedback Geral da Turma' });
    expect(dialog).toBeInTheDocument();
    expect(screen.getByLabelText(/comentário geral/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/nota/i)).not.toBeInTheDocument();
  });

  it('intercepts and sends individual feedback submission correctly', async () => {
    const user = userEvent.setup();

    vi.mocked(feedbackService.saveStudentFeedback).mockResolvedValue({
      id: 'fb-1',
      escopo: 'ALUNO',
      destinatarioId: 'aluno-1',
      nota: 9.5,
      texto: 'Desempenho excelente no problema.',
      criadoEm: '2026-10-11T12:00:00Z',
      editadoEm: null,
    });

    renderPage();

    const gradeCell = await screen.findByRole('button', { name: /Ana Silva.*S1/i });
    await user.click(gradeCell);

    const gradeInput = screen.getByLabelText(/nota/i);
    const commentInput = screen.getByLabelText(/comentário de feedback/i);

    await user.clear(gradeInput);
    await user.type(gradeInput, '9.5');
    await user.type(commentInput, 'Desempenho excelente no problema.');
    await user.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(feedbackService.saveStudentFeedback).toHaveBeenCalledWith(
      'room-1',
      'prob-1',
      'aluno-1',
      {
        escopo: 'ALUNO',
        destinatario_id: 'aluno-1',
        nota: 9.5,
        texto: 'Desempenho excelente no problema.',
      },
    );
  });

  it('intercepts and sends general feedback submission correctly', async () => {
    const user = userEvent.setup();

    vi.mocked(feedbackService.saveGeneralFeedback).mockResolvedValue({
      id: 'fb-gen',
      escopo: 'PROBLEMA',
      texto: 'A turma colaborou bem na busca pelas referências.',
      criadoEm: '2026-10-11T12:00:00Z',
      editadoEm: null,
    });

    renderPage();

    const generalBtn = await screen.findByRole('button', {
      name: 'Feedback geral da turma',
    });
    await user.click(generalBtn);

    const commentInput = screen.getByLabelText(/comentário geral/i);
    await user.type(commentInput, 'A turma colaborou bem na busca pelas referências.');
    await user.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(feedbackService.saveGeneralFeedback).toHaveBeenCalledWith('room-1', 'prob-1', {
      escopo: 'PROBLEMA',
      destinatario_id: null,
      nota: null,
      texto: 'A turma colaborou bem na busca pelas referências.',
    });
  });
});
