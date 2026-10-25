import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { ClassReportTable } from './ClassReportTable';
import type { ClassReportProblem, ClassReportStudent } from '@/types/class-report';

describe('ClassReportTable', () => {
  const mockProblemas: ClassReportProblem[] = [
    { id: 'prob-2', titulo: 'Problema 2 - Cardiopatia', ordem: 2 },
    { id: 'prob-1', titulo: 'Problema 1 - Prontuário', ordem: 1 },
  ];

  const mockAlunos: ClassReportStudent[] = [
    {
      id: 'student-1',
      nome: 'Ana Souza',
      matricula: '20260001',
      mediaGeral: 8.5,
      isParcial: false,
      notasProblemas: [
        { problemaId: 'prob-1', notaFinal: 7.0 },
        { problemaId: 'prob-2', notaFinal: 10.0 },
      ],
    },
    {
      id: 'student-2',
      nome: 'Bruno Lima',
      matricula: '20260002',
      mediaGeral: 0.0,
      isParcial: false,
      notasProblemas: [
        { problemaId: 'prob-1', notaFinal: 0.0 },
        { problemaId: 'prob-2', notaFinal: 6.9 },
      ],
    },
    {
      id: 'student-3',
      nome: 'Carlos Dias',
      matricula: null,
      mediaGeral: null,
      isParcial: true,
      notasProblemas: [
        { problemaId: 'prob-1', notaFinal: null },
        { problemaId: 'prob-2', notaFinal: null },
      ],
    },
  ];

  it('renders table headers with single Aluno column and orders problems chronologically', () => {
    render(<ClassReportTable problemas={mockProblemas} alunos={mockAlunos} />);

    expect(screen.getByRole('columnheader', { name: /aluno/i })).toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: /matrícula/i })).not.toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Média Geral' })).toBeInTheDocument();

    const headers = screen.getAllByRole('columnheader');
    const headerTexts = headers.map((h) => h.textContent?.trim());

    const p1Index = headerTexts.indexOf('Problema 1 - Prontuário');
    const p2Index = headerTexts.indexOf('Problema 2 - Cardiopatia');
    expect(p1Index).toBeGreaterThan(-1);
    expect(p2Index).toBeGreaterThan(-1);
    expect(p1Index).toBeLessThan(p2Index);
  });

  it('toggles between student names and matriculas with Ocultar nomes switch', async () => {
    const user = userEvent.setup();
    render(<ClassReportTable problemas={mockProblemas} alunos={mockAlunos} />);

    // Initially names and ALUNO header are visible
    expect(screen.getByRole('columnheader', { name: 'ALUNO' })).toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: 'MATRÍCULA' })).not.toBeInTheDocument();
    expect(screen.getByText('Ana Souza')).toBeInTheDocument();
    expect(screen.getByText('Bruno Lima')).toBeInTheDocument();
    expect(screen.getByText('Carlos Dias')).toBeInTheDocument();
    expect(screen.queryByText('20260001')).not.toBeInTheDocument();

    // Toggle to hide names
    const toggleSwitch = screen.getByRole('switch', { name: 'Ocultar nomes' });
    await user.click(toggleSwitch);

    // Header changes to MATRÍCULA, matriculas are visible and Carlos shows "Sem matrícula"
    expect(screen.getByRole('columnheader', { name: 'MATRÍCULA' })).toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: 'ALUNO' })).not.toBeInTheDocument();
    expect(screen.queryByText('Ana Souza')).not.toBeInTheDocument();
    expect(screen.getByText('20260001')).toBeInTheDocument();
    expect(screen.getByText('20260002')).toBeInTheDocument();
    expect(screen.getByText('Sem matrícula')).toBeInTheDocument();

    // Toggle back
    await user.click(toggleSwitch);
    expect(screen.getByRole('columnheader', { name: 'ALUNO' })).toBeInTheDocument();
    expect(screen.getByText('Ana Souza')).toBeInTheDocument();
  });

  it('differentiates 0 from null, formatting 0 as 0,0 and null as em-dash', () => {
    render(<ClassReportTable problemas={mockProblemas} alunos={mockAlunos} />);

    const zeroGrades = screen.getAllByText('0,0');
    expect(zeroGrades.length).toBeGreaterThanOrEqual(1);

    const dashes = screen.getAllByText('—');
    expect(dashes.length).toBeGreaterThanOrEqual(2);
  });

  it('applies green color for grades >= 7,0 and red color for grades < 7,0', () => {
    render(<ClassReportTable problemas={mockProblemas} alunos={mockAlunos} />);

    const grade7 = screen.getByText('7,0');
    expect(grade7).toHaveClass('text-success');

    const grade10 = screen.getByText('10,0');
    expect(grade10).toHaveClass('text-success');

    const grade69 = screen.getByText('6,9');
    expect(grade69).toHaveClass('text-danger');

    const grade0 = screen.getAllByText('0,0')[0];
    expect(grade0).toHaveClass('text-danger');
  });

  it('renders em-dash with text-muted neutral color for null grades', () => {
    render(<ClassReportTable problemas={mockProblemas} alunos={mockAlunos} />);

    const cells = screen.getAllByRole('cell');
    const mutedDashes = cells.filter(
      (c) => c.textContent?.trim() === '—' && c.classList.contains('text-muted'),
    );
    expect(mutedDashes.length).toBeGreaterThan(0);
  });

  it('displays visual indicator for partial average (isParcial = true)', () => {
    render(<ClassReportTable problemas={mockProblemas} alunos={mockAlunos} />);

    expect(screen.getByText('Parcial')).toBeInTheDocument();
    expect(
      screen.getByLabelText('Média parcial: faltam notas para compor a média final'),
    ).toBeInTheDocument();
  });

  it('shows empty message when no students are present', () => {
    render(<ClassReportTable problemas={mockProblemas} alunos={[]} />);

    expect(screen.getByText('Não há alunos vinculados a esta turma.')).toBeInTheDocument();
  });
});
