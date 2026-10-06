import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SessionEvaluationsCard } from './SessionEvaluationsCard';

describe('SessionEvaluationsCard', () => {
  it('renders evaluations card with title, subtitle and Em breve badge', () => {
    render(<SessionEvaluationsCard />);

    expect(screen.getByText('Autoavaliação e pares')).toBeInTheDocument();
    expect(
      screen.getByText(/os alunos só veem os formulários quando você libera/i),
    ).toBeInTheDocument();
    expect(screen.getByText('Em breve')).toBeInTheDocument();
  });

  it('renders locked toggle rows for student self-evaluation and peer evaluation', () => {
    render(<SessionEvaluationsCard />);

    expect(screen.getByText('Autoavaliação dos alunos')).toBeInTheDocument();
    expect(screen.getByText('Avaliação entre pares')).toBeInTheDocument();
    expect(screen.getAllByText('Bloqueada')).toHaveLength(2);
  });
});
