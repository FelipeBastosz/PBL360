import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { EvaluationFinalScore } from './EvaluationFinalScore';

const mockCriteria = [
  { id: '1', nome: 'Critério 1', peso: 5, ordem: 1, notaMaxima: 10 },
  { id: '2', nome: 'Critério 2', peso: 5, ordem: 2, notaMaxima: 10 },
];

describe('EvaluationFinalScore', () => {
  it('calculates weighted mean when no bonus is provided', () => {
    render(<EvaluationFinalScore criteria={mockCriteria} scores={{ '1': 8, '2': 6 }} />);

    expect(screen.getByText('7.0')).toBeInTheDocument();
    expect(screen.queryByText('Nota de cargo na sessão')).not.toBeInTheDocument();
  });

  it('calculates final score applying 70/30 role bonus', () => {
    render(<EvaluationFinalScore criteria={mockCriteria} scores={{ '1': 8, '2': 8 }} bonus={10} />);

    expect(screen.getByText('Nota de cargo na sessão')).toBeInTheDocument();
    expect(screen.getByText('10.0')).toBeInTheDocument();
    expect(screen.getByText('8.6')).toBeInTheDocument();
  });
});
