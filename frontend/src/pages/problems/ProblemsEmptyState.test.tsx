import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ProblemsEmptyState } from './ProblemsEmptyState';

describe('ProblemsEmptyState', () => {
  it('renders teacher-specific message and instructions to add problem', () => {
    render(<ProblemsEmptyState isProfessor={true} />);

    expect(screen.getByText('Nenhum problema cadastrado nesta turma.')).toBeInTheDocument();
    expect(screen.getByText(/para cadastrar o primeiro problema/i)).toBeInTheDocument();
  });

  it('renders student-specific message and waiting instructions', () => {
    render(<ProblemsEmptyState isProfessor={false} />);

    expect(
      screen.getByText('Nenhum problema disponível nesta turma no momento.'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/aguarde o professor publicar as primeiras atividades/i),
    ).toBeInTheDocument();
    expect(screen.queryByText(/toque no/i)).not.toBeInTheDocument();
  });
});
