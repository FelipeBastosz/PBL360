import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import type { SessionEvaluationSummary } from '@/types/evaluation';
import { StudentEvaluationCard } from './StudentEvaluationCard';

const baseStudent: SessionEvaluationSummary = {
  alunoId: 'student-1',
  nome: 'Ana Souza',
  iniciais: 'AS',
  presenca: null,
  status: 'PENDENTE',
  notaSessao: null,
};

describe('StudentEvaluationCard', () => {
  it('renders PENDENTE status with "Pendente" badge and "Avaliar" button', () => {
    render(
      <MemoryRouter>
        <StudentEvaluationCard student={baseStudent} evaluationUrl="/avaliar/1" />
      </MemoryRouter>,
    );

    expect(screen.getByText('Ana Souza')).toBeInTheDocument();
    expect(screen.getByText('Pendente')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Avaliar' })).toHaveAttribute('href', '/avaliar/1');
  });

  it('renders RASCUNHO status with "Rascunho" badge and "Continuar" button', () => {
    const draftStudent = { ...baseStudent, status: 'RASCUNHO' as const };

    render(
      <MemoryRouter>
        <StudentEvaluationCard student={draftStudent} evaluationUrl="/avaliar/1" />
      </MemoryRouter>,
    );

    expect(screen.getByText('Rascunho')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Continuar' })).toHaveAttribute('href', '/avaliar/1');
  });

  it('renders ENVIADA status with "Enviada · Nota" badge and "Editar" button', () => {
    const sentStudent = {
      ...baseStudent,
      status: 'ENVIADA' as const,
      notaSessao: 9.5,
    };

    render(
      <MemoryRouter>
        <StudentEvaluationCard student={sentStudent} evaluationUrl="/avaliar/1" />
      </MemoryRouter>,
    );

    expect(screen.getByText('Enviada · 9.5')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Editar' })).toHaveAttribute('href', '/avaliar/1');
  });

  it('renders attendance badges for absent and justified students', () => {
    const absentStudent = { ...baseStudent, presenca: 'ausente' as const };
    const { rerender } = render(
      <MemoryRouter>
        <StudentEvaluationCard student={absentStudent} evaluationUrl="/avaliar/1" />
      </MemoryRouter>,
    );

    expect(screen.getByText('Falta')).toBeInTheDocument();

    const justifiedStudent = { ...baseStudent, presenca: 'justificado' as const };
    rerender(
      <MemoryRouter>
        <StudentEvaluationCard student={justifiedStudent} evaluationUrl="/avaliar/1" />
      </MemoryRouter>,
    );

    expect(screen.getByText('Falta justificada')).toBeInTheDocument();
  });

  it('renders disabled button when disabled prop is true', () => {
    render(
      <MemoryRouter>
        <StudentEvaluationCard student={baseStudent} evaluationUrl="/avaliar/1" disabled={true} />
      </MemoryRouter>,
    );

    const button = screen.getByRole('button', { name: 'Avaliar' });
    expect(button).toBeDisabled();
    expect(screen.queryByRole('link', { name: 'Avaliar' })).not.toBeInTheDocument();
  });
});
