import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ProblemGradesTable } from './ProblemGradesTable';
import type { ProblemGradesResponse } from '@/types/grades';

const mockGradesData: ProblemGradesResponse = {
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

  it('calls onSelectStudent when clicking a student row', async () => {
    const user = userEvent.setup();
    const handleSelect = vi.fn();

    render(
      <ProblemGradesTable
        data={mockGradesData}
        hideNames={false}
        onToggleHideNames={vi.fn()}
        onSelectStudent={handleSelect}
      />,
    );

    const studentRow = screen.getByRole('button', { name: 'Ver feedback de Ana Silva' });
    await user.click(studentRow);

    expect(handleSelect).toHaveBeenCalledWith(mockGradesData.alunos[0]);
  });
});
