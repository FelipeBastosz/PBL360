import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ProblemGradesTable } from './ProblemGradesTable';
import type { ProblemGradesResponse } from '@/types/grades';

const mockGradesData: ProblemGradesResponse = {
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
      autoavaliacao: { nota: null, situacao: 'PENDENTE' },
      pares: { nota: null, situacao: 'PENDENTE' },
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
      notaFinal: 6.0,
      autoavaliacao: { nota: null, situacao: 'PENDENTE' },
      pares: { nota: null, situacao: 'PENDENTE' },
    },
  ],
  mediaTurma: 7.3,
  versoesFormula: { sessao: 1, problema: 1 },
};

describe('ProblemGradesTable', () => {
  it('renders student list, column headers, session grades, final grades, and class average', () => {
    render(
      <ProblemGradesTable
        data={mockGradesData}
        hideNames={false}
        onToggleHideNames={vi.fn()}
        onSelectStudent={vi.fn()}
      />,
    );

    expect(screen.getByRole('columnheader', { name: 'ALUNO' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'S1' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'S2' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'S3' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'GERAL' })).toBeInTheDocument();

    expect(screen.getByText('Ana Silva')).toBeInTheDocument();
    expect(screen.getByText('8,5')).toBeInTheDocument();
    expect(screen.getByText('9,0')).toBeInTheDocument();
    expect(screen.getByText('8,2')).toBeInTheDocument();
    expect(screen.getByText('8,6')).toBeInTheDocument();

    expect(screen.getByText('Bruno Mendes')).toBeInTheDocument();
    expect(screen.getByText('Média da turma')).toBeInTheDocument();
    expect(screen.getByText('7,3')).toBeInTheDocument();
  });

  it('renders pending (—), excused (J), and absent (0,0) states correctly, blocking interaction on — and J', () => {
    render(
      <ProblemGradesTable
        data={mockGradesData}
        hideNames={false}
        onToggleHideNames={vi.fn()}
        onSelectStudent={vi.fn()}
      />,
    );

    // Bruno's sessions: S1 is pending (—), S2 is excused (J), S3 is absent (0,0)
    const excusedCell = screen.getByText('J');
    expect(excusedCell).toBeInTheDocument();
    expect(excusedCell.closest('td')).not.toHaveAttribute('role', 'button');

    const dashes = screen.getAllByText('—');
    expect(dashes.length).toBeGreaterThan(0);
    expect(dashes[0]?.closest('td')).not.toHaveAttribute('role', 'button');

    // S3 absent has score 0.0 and remains interactive as a calculable grade
    const absentCell = screen.getByRole('button', { name: /Bruno Mendes.*S3.*0,0/i });
    expect(absentCell).toBeInTheDocument();
  });

  it('toggles column header from ALUNO to MATRÍCULA and displays matricula when hideNames is true', async () => {
    const user = userEvent.setup();
    const handleToggle = vi.fn();

    const { rerender } = render(
      <ProblemGradesTable
        data={mockGradesData}
        hideNames={false}
        onToggleHideNames={handleToggle}
        onSelectStudent={vi.fn()}
      />,
    );

    expect(screen.getByRole('columnheader', { name: 'ALUNO' })).toBeInTheDocument();
    expect(screen.getByText('Ana Silva')).toBeInTheDocument();
    expect(screen.queryByText('26121190')).not.toBeInTheDocument();

    const toggleButton = screen.getByRole('switch', { name: 'Ocultar nomes' });
    await user.click(toggleButton);

    expect(handleToggle).toHaveBeenCalledWith(true);

    // Rerender with hideNames = true
    rerender(
      <ProblemGradesTable
        data={mockGradesData}
        hideNames={true}
        onToggleHideNames={handleToggle}
        onSelectStudent={vi.fn()}
      />,
    );

    expect(screen.getByRole('columnheader', { name: 'MATRÍCULA' })).toBeInTheDocument();
    expect(screen.getByText('26121190')).toBeInTheDocument();
    expect(screen.getByText('26121191')).toBeInTheDocument();
    expect(screen.queryByText('Ana Silva')).not.toBeInTheDocument();
  });

  it('calls onSelectStudent and onSelectEvaluation when clicking a grade cell, keeping student name static', async () => {
    const user = userEvent.setup();
    const handleSelectStudent = vi.fn();
    const handleSelectEvaluation = vi.fn();

    render(
      <ProblemGradesTable
        data={mockGradesData}
        hideNames={false}
        onToggleHideNames={vi.fn()}
        onSelectStudent={handleSelectStudent}
        onSelectEvaluation={handleSelectEvaluation}
      />,
    );

    const studentName = screen.getByText('Ana Silva');
    expect(studentName.closest('button')).toBeNull();
    expect(studentName.closest('tr')).not.toHaveAttribute('role', 'button');

    const gradeCell = screen.getByRole('button', { name: /Ana Silva.*S1/i });
    await user.click(gradeCell);

    expect(handleSelectEvaluation).toHaveBeenCalledWith(
      expect.objectContaining({
        studentId: 'aluno-1',
        sessionId: 'sess-1',
        sessionName: 'S1',
        currentGrade: 8.5,
      }),
    );
    expect(handleSelectStudent).toHaveBeenCalledWith(mockGradesData.alunos[0]);
  });

  it('matches feedback scoped by session id and preserves grade 0 without treating as falsy', async () => {
    const user = userEvent.setup();
    const handleSelectEvaluation = vi.fn();

    const feedbacks = {
      geral: null,
      alunos: [
        {
          alunoId: 'aluno-1',
          nome: 'Ana Silva',
          sessaoId: 'sess-1',
          feedback: {
            id: 'fb-s1',
            escopo: 'ALUNO' as const,
            destinatarioId: 'aluno-1',
            sessaoId: 'sess-1',
            nota: 0,
            texto: 'Feedback específico da S1',
            criadoEm: '2026-10-01T10:00:00Z',
            editadoEm: null,
            justificativa: 'Nota zerada por critério específico',
          },
        },
      ],
    };

    render(
      <ProblemGradesTable
        data={mockGradesData}
        hideNames={false}
        onToggleHideNames={vi.fn()}
        onSelectEvaluation={handleSelectEvaluation}
        feedbacks={feedbacks}
      />,
    );

    // Click S1 which has session feedback with grade 0
    const cellS1 = screen.getByRole('button', { name: /Ana Silva.*S1/i });
    await user.click(cellS1);

    expect(handleSelectEvaluation).toHaveBeenLastCalledWith(
      expect.objectContaining({
        studentId: 'aluno-1',
        sessionId: 'sess-1',
        currentGrade: 0,
        currentFeedback: 'Feedback específico da S1',
        existingFeedback: expect.objectContaining({ id: 'fb-s1', nota: 0 }),
      }),
    );

    // Click S2 which has NO session feedback -> should not inherit S1 feedback
    const cellS2 = screen.getByRole('button', { name: /Ana Silva.*S2/i });
    await user.click(cellS2);

    expect(handleSelectEvaluation).toHaveBeenLastCalledWith(
      expect.objectContaining({
        studentId: 'aluno-1',
        sessionId: 'sess-2',
        currentGrade: 9.0,
        currentFeedback: '',
        existingFeedback: null,
      }),
    );
  });

  it('applies defensive session name fallback hierarchy and tooltip in header', () => {
    const customData: ProblemGradesResponse = {
      ...mockGradesData,
      sessoes: [
        { id: 's-1', nome: 'Sessão Nome' },
        { id: 's-2', name: 'Session Name' },
        { id: 's-3', titulo: 'Sessão Título' },
        { id: 's-4', title: 'Session Title' },
        { id: 's-5', descricao: 'Sessão Desc' },
        { id: 's-6', rotulo: 'S6' },
      ],
      alunos: [],
    };

    render(<ProblemGradesTable data={customData} hideNames={false} onToggleHideNames={vi.fn()} />);

    const headers = [
      'Sessão Nome',
      'Session Name',
      'Sessão Título',
      'Session Title',
      'Sessão Desc',
      'S6',
    ];

    headers.forEach((headerName) => {
      const th = screen.getByRole('columnheader', { name: headerName });
      expect(th).toBeInTheDocument();
      expect(th).toHaveAttribute('title', headerName);
      expect(th).toHaveClass('bg-brand-50');
      expect(th).toHaveClass('truncate');
    });

    const alunoHeader = screen.getByRole('columnheader', { name: 'ALUNO' });
    const geralHeader = screen.getByRole('columnheader', { name: 'GERAL' });
    expect(alunoHeader).toHaveClass('bg-brand-50');
    expect(geralHeader).toHaveClass('bg-brand-50');
  });
});
