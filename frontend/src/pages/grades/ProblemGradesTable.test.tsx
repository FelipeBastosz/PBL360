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

  it('renders pending (—), excused (J), and absent (0,0) states correctly', () => {
    render(
      <ProblemGradesTable
        data={mockGradesData}
        hideNames={false}
        onToggleHideNames={vi.fn()}
        onSelectStudent={vi.fn()}
      />,
    );

    // Bruno's sessions: S1 is pending (—), S2 is excused (J), S3 is absent (0,0)
    expect(screen.getByText('J')).toBeInTheDocument();
    expect(screen.getByText('0,0')).toBeInTheDocument();
    // Pending cell renders '—'
    const dashes = screen.getAllByText('—');
    expect(dashes.length).toBeGreaterThan(0);
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
